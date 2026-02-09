import { Request as ExpressRequest } from "express";
import Joi from "joi";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import {
  UpdatePasswordInfo,
  ValidUserEmailAndPassword,
} from "@app-types/user/update-password";
import { reqErrorMessages } from "@services/request-error-messages";
import { genSalt, hash } from "bcrypt";
import { db } from "@services/database";
import { databaseQuery } from "@services/database/queries";

// Schema validation
const verifyUserInfoSchema = Joi.object({
  password: newUserAttributes.password.joiSchema,
  token: Joi.string().token(),
});

/**
 * Deterimines if the user's email and password are valid.
 * @param userInfo The user's info to validate
 */
const validateUserInfo = (
  userInfo: UpdatePasswordInfo,
): ValidUserEmailAndPassword => {
  const { error, value } = verifyUserInfoSchema.validate(userInfo);

  if (error) {
    return {
      errorMessage: error.message,
      isValid: false,
      validatedValue: undefined,
    };
  } else {
    return { errorMessage: null, isValid: true, validatedValue: value };
  }
};

/**
 * Updates a user's password for a password reset.
 * @param req The network request
 */
export const updatePassword = async (req: ExpressRequest): Promise<void> => {
  const userInfo: UpdatePasswordInfo = req.body;
  const { isValid, errorMessage, validatedValue } = validateUserInfo(userInfo);

  if (isValid) {
    try {
      const loadedApprovedPasswordReset =
        await db.approvedPasswordReset.getAprByToken(validatedValue.token);

      if (databaseQuery.isFailedQueryResult(loadedApprovedPasswordReset)) {
        if (loadedApprovedPasswordReset.message === "invalid-token") {
          throw Error(reqErrorMessages.forbiddenUser);
        } else {
          throw Error(reqErrorMessages.serverError);
        }
      }

      const loadedUser = await loadedApprovedPasswordReset.getUser();

      if (databaseQuery.isFailedQueryResult(loadedUser)) {
        throw Error(reqErrorMessages.serverError);
      }

      const hashSalt = await genSalt();
      validatedValue.password = await hash(validatedValue.password, hashSalt);

      const updatedUser = await db.user.updateUser(loadedUser.email, {
        firstName: loadedUser.firstName,
        lastName: loadedUser.lastName,
        password: validatedValue.password,
      });

      if (databaseQuery.isFailedQueryResult(updatedUser)) {
        throw Error(reqErrorMessages.serverError);
      } else {
        RequestSuccess(req, true);
      }
    } catch (error: any) {
      if (error.message === reqErrorMessages.forbiddenUser) {
        RequestError(
          req,
          Error(
            "The time frame to update the password has expired. Please make another request to update your password.",
          ),
        ).badRequest();
      } else {
        // Default error message
        RequestError(
          req,
          Error("Failed to update the user's password"),
        ).server();
      }
    }
  }
  // If the user's information is invalid
  else {
    RequestError(req, Error(errorMessage)).validation();
  }
};
