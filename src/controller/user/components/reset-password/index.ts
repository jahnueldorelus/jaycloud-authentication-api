import { Request as ExpressRequest } from "express";
import Joi from "joi";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { connection } from "mongoose";
import { UserEmail, ValidUserEmail } from "@app-types/user/reset-password";
import { dbAuth } from "@services/database";

// Schema validation
const resetPasswordSchema = Joi.object({
  email: newUserAttributes.email.joiSchema,
});

/**
 * Deterimines if the user's email is valid.
 * @param userEmail The user's email to validate
 */
const validateUserEmail = (userEmail: UserEmail): ValidUserEmail => {
  const { error, value } = resetPasswordSchema.validate(userEmail);
  return {
    isValid: error ? false : true,
    errorMessage: error ? error.message : null,
    validatedValue: value,
  };
};

/**
 * Creates a temporary token for a password reset.
 * @param req The network request
 */
export const resetPassword = async (req: ExpressRequest): Promise<void> => {
  // The user's new account info from the request
  const userInfo: UserEmail = req.body;

  // Determines if the user's information is valid
  const { isValid, errorMessage, validatedValue } = validateUserEmail(userInfo);

  // If the user's information is valid
  if (isValid) {
    const dbSession = await connection.startSession();

    try {
      dbSession.startTransaction();

      const user = await dbAuth.usersModel.findOne({
        email: validatedValue.email,
      });

      if (user) {
        const tempToken = await dbAuth.tempTokenModel.createTempToken(
          user.id,
          dbSession
        );
        await dbSession.commitTransaction();

        if (!tempToken) {
          throw Error("Failed to create temporary token");
        }

        console.log(tempToken?.tokenNumber);
        // SEND EMAIL TO USER WITH THEIR TEMPORARY TOKEN HERE
      }

      RequestSuccess(req, true);
    } catch (error: any) {
      await dbSession.abortTransaction();

      RequestError(
        req,
        Error("Failed to start process of resetting user's password")
      ).server();
    } finally {
      await dbSession.endSession();
    }
  }
  // If the user's account information is invalid
  else {
    RequestError(req, Error(errorMessage || undefined)).validation();
  }
};
