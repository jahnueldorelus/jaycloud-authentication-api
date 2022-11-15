import { Request as ExpressRequest } from "express";
import Joi from "joi";
import { dbAuth } from "@services/database";
import {
  UserCredentials,
  ValidCredentials,
} from "@app-types/user/authenticate-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { connection } from "mongoose";
import { reqErrorMessages } from "@services/request-error-messages";
import { envNames } from "@startup/config";

// Schema validation
const userCredentialsSchema = Joi.object({
  email: Joi.string().lowercase().email().min(2).max(100).required(),
  password: Joi.string().min(5).max(100).required(),
});

/**
 * Deterimines if the user's account information is valid.
 * @param credentials The user's credentials to validate
 */
const validateAccount = (credentials: UserCredentials): ValidCredentials => {
  const { error, value } = userCredentialsSchema.validate(credentials);
  return {
    isValid: error ? false : true,
    errorMessage: error ? error.message : null,
    validatedValue: value,
  };
};

/**
 * Authenticates a user
 * @param req The network request
 */
export const authenticateUser = async (req: ExpressRequest): Promise<void> => {
  const credentials: UserCredentials = req.body;

  // Determines if the user's credentials are valid
  const { isValid, errorMessage, validatedValue } =
    validateAccount(credentials);

  if (isValid) {
    const dbSession = await connection.startSession();

    try {
      const user = await dbAuth.usersModel.authenticateUser(
        validatedValue.email,
        validatedValue.password
      );

      if (!user) {
        throw Error(reqErrorMessages.authFailed);
      }

      dbSession.startTransaction();

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

      await dbSession.commitTransaction();

      if (accessToken && refreshToken) {
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
      } else {
        throw Error();
      }
    } catch (error: any) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      // Authentication failed error
      if (error.message === reqErrorMessages.authFailed) {
        RequestError(req, error).badRequest();
      } else {
        // Default error
        RequestError(req, Error("Failed to authenticate user.")).server();
      }
    } finally {
      await dbSession.endSession();
    }
  } else {
    RequestError(req, Error(errorMessage || undefined)).validation();
  }
};
