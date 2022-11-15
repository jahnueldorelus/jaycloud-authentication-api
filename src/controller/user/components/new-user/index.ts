import { Request as ExpressRequest } from "express";
import Joi from "joi";
import { genSalt, hash } from "bcrypt";
import { dbAuth } from "@services/database";
import {
  newUserAttributes,
  ValidNewUserAccount,
} from "@app-types/user/new-user";
import { UserData } from "@app-types/user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { connection } from "mongoose";
import { envNames } from "@startup/config";

// Schema validation
const newAccountSchema = Joi.object({
  firstName: newUserAttributes.firstName.joiSchema,
  lastName: newUserAttributes.lastName.joiSchema,
  email: newUserAttributes.email.joiSchema,
  password: newUserAttributes.password.joiSchema,
});

/**
 * Deterimines if the user's new account information is valid.
 * @param {object} newAccount The user's information to validate
 */
const validateAccount = (newAccount: UserData): ValidNewUserAccount => {
  const { error, value } = newAccountSchema.validate(newAccount, {
    // Allows for unknown properties
    allowUnknown: true,
  });
  return {
    isValid: error ? false : true,
    errorMessage: error ? error.message : null,
    validatedValue: value,
  };
};

/**
 * Creates a new user
 * @param req The network request
 */
export const createNewUser = async (req: ExpressRequest): Promise<void> => {
  // The user's new account info from the request
  const newAccountInfo: UserData = req.body;

  // Determines if the user's information is valid
  const { isValid, errorMessage, validatedValue } =
    validateAccount(newAccountInfo);

  // If the user's account information is valid
  if (isValid) {
    const dbSession = await connection.startSession();

    try {
      // Generates a salt for encryption
      const salt = await genSalt();
      // Hashes the user's password
      validatedValue.password = await hash(validatedValue.password, salt);

      dbSession.startTransaction();

      const [user] = await dbAuth.usersModel.create([validatedValue], {
        session: dbSession,
      });
      if (!user) {
        throw Error();
      }

      const accessToken = user.generateAccessToken();

      const refreshTokenFamily =
        await dbAuth.refreshTokenFamiliesModel.createTokenFamily(
          user.id,
          dbSession
        );
      if (!refreshTokenFamily) {
        throw Error();
      }

      const refreshToken = await dbAuth.refreshTokensModel.createToken(
        user.id,
        refreshTokenFamily.id,
        dbSession
      );
      if (!refreshToken) {
        throw Error();
      }
      await dbSession.commitTransaction();

      RequestSuccess(req, user.toPrivateJSON(), [
        // The access token
        {
          headerName: <string>process.env[envNames.jwt.accessReqHeader],
          headerValue: accessToken,
        },
        // The refresh token
        {
          headerName: <string>process.env[envNames.jwt.refreshReqHeader],
          headerValue: refreshToken.token,
        },
      ]);
    } catch (error: any) {
      await dbSession.abortTransaction();

      // If the error is a duplicate email
      if (error && error.code === 11000 && error.keyPattern.email === 1) {
        RequestError(
          req,
          Error(
            `Failed to create a new account for "${validatedValue.email}". This email is already registered.`
          )
        ).badRequest();
      } else {
        // Default error
        RequestError(req, Error("Failed to create a new account.")).server();
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
