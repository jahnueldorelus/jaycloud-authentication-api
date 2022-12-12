import { Request as ExpressRequest } from "express";
import Joi from "joi";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { connection } from "mongoose";
import {
  UserEmailAndToken,
  ValidUserEmailAndToken,
} from "@app-types/user/verify-temp-token";
import { dbAuth } from "@services/database";
import { reqErrorMessages } from "@services/request-error-messages";

// Schema validation
const verifyTempTokenSchema = Joi.object({
  email: newUserAttributes.email.joiSchema,
  token: Joi.string().token().required(),
});

/**
 * Deterimines if the user's email and token are valid.
 * @param userInfo The user's info to validate
 */
const validateUserInfo = (
  userInfo: UserEmailAndToken
): ValidUserEmailAndToken => {
  const { error, value } = verifyTempTokenSchema.validate(userInfo);
  return {
    isValid: error ? false : true,
    errorMessage: error ? error.message : null,
    validatedValue: value,
  };
};

/**
 * Verifies a temporary token for a password reset.
 * @param req The network request
 */
export const verifyTempToken = async (req: ExpressRequest): Promise<void> => {
  // The user's new account info from the request
  const userInfo: UserEmailAndToken = req.body;

  // Determines if the user's information is valid
  const { isValid, errorMessage, validatedValue } = validateUserInfo(userInfo);

  // If the user's information is valid
  if (isValid) {
    const dbSession = await connection.startSession();

    try {
      dbSession.startTransaction();

      const user = await dbAuth.usersModel.findOne({
        email: validatedValue.email,
      });

      if (!user) {
        throw Error(reqErrorMessages.nonExistentUser);
      }

      const tempToken = await dbAuth.tempTokenModel.findOne({
        userId: user.id,
        token: validatedValue.token,
      });

      if (!tempToken) {
        throw Error(reqErrorMessages.invalidToken);
      }

      await tempToken.delete();

      await dbAuth.approvedPasswordResetModel.createApprovedPasswordReset(
        user.id,
        dbSession
      );

      await dbSession.commitTransaction();

      RequestSuccess(req, true);
    } catch (error: any) {
      await dbSession.abortTransaction();

      if (
        error.message === reqErrorMessages.nonExistentUser ||
        error.message === reqErrorMessages.invalidToken
      ) {
        RequestError(req, Error("An invalid token was provided")).badRequest();
      } else {
        // Default error message
        RequestError(
          req,
          Error("Failed to verify the token provided")
        ).server();
      }
    } finally {
      await dbSession.endSession();
    }
  }
  // If the user's account information is invalid
  else {
    RequestError(req, Error(errorMessage || undefined)).validation();
  }
};
