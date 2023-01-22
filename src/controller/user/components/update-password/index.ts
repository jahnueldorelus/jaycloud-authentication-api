import { Request as ExpressRequest } from "express";
import Joi from "joi";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { connection } from "mongoose";
import {
  UpdatePasswordInfo,
  ValidUserEmailAndPassword,
} from "@app-types/user/update-password";
import { dbAuth } from "@services/database";
import { reqErrorMessages } from "@services/request-error-messages";
import { genSalt, hash } from "bcrypt";
import moment from "moment";

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
  userInfo: UpdatePasswordInfo
): ValidUserEmailAndPassword => {
  const { error, value } = verifyUserInfoSchema.validate(userInfo);
  return {
    isValid: error ? false : true,
    errorMessage: error ? error.message : null,
    validatedValue: value,
  };
};

/**
 * Updates a user's password for a password reset.
 * @param req The network request
 */
export const updatePassword = async (req: ExpressRequest): Promise<void> => {
  // The user's info from the request
  const userInfo: UpdatePasswordInfo = req.body;

  // Determines if the user's information is valid
  const { isValid, errorMessage, validatedValue } = validateUserInfo(userInfo);

  // If the user's information is valid
  if (isValid) {
    const dbSession = await connection.startSession();

    try {
      dbSession.startTransaction();

      const approvedPasswordReset =
        await dbAuth.approvedPasswordResetModel.findOneAndDelete(
          { token: validatedValue.token },
          { session: dbSession }
        );

      const currentDateAndTime = moment(new Date());

      // If there's no approved password reset or it's expired
      if (
        !approvedPasswordReset ||
        moment(approvedPasswordReset.expDate).isBefore(currentDateAndTime)
      ) {
        throw Error(reqErrorMessages.forbiddenUser);
      }

      const user = await dbAuth.usersModel.findById(
        approvedPasswordReset.userId,
        null,
        { session: dbSession }
      );

      if (!user) {
        throw Error(reqErrorMessages.nonExistentUser);
      }

      const hashSalt = await genSalt();
      validatedValue.password = await hash(validatedValue.password, hashSalt);

      user.password = validatedValue.password;

      await user.save({ session: dbSession });
      await dbSession.commitTransaction();

      RequestSuccess(req, true);
    } catch (error: any) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      if (error.message === reqErrorMessages.nonExistentUser) {
        RequestError(
          req,
          Error(
            "Your request to update the password is invalid. Please make another request to update your password."
          )
        ).validation();
      } else if (error.message === reqErrorMessages.forbiddenUser) {
        RequestError(
          req,
          Error(
            "The time frame to update the password has expired. Please make another request to update your password."
          )
        ).badRequest();
      } else {
        // Default error message
        RequestError(
          req,
          Error("Failed to update the user's password")
        ).badRequest();
      }
    } finally {
      await dbSession.endSession();
    }
  }
  // If the user's information is invalid
  else {
    RequestError(req, Error(errorMessage || undefined)).validation();
  }
};
