import { Request as ExpressRequest } from "express";
import Joi from "joi";
import { dbAuth } from "@services/database";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { connection } from "mongoose";
import { reqErrorMessages } from "@services/request-error-messages";
import {
  RefreshToken,
  ValidRefreshToken,
} from "@app-types/token/refresh-token";
import { envNames } from "@startup/config";

// Schema validation
const refreshTokenSchema = Joi.object({
  token: Joi.string().guid().required(),
});

/**
 * Deterimines if the user's refresh token is valid.
 * @param refreshToken The user's refresh token to validate
 */
const validateOldRefreshToken = (
  refreshToken: RefreshToken
): ValidRefreshToken => {
  const { error, value } = refreshTokenSchema.validate(refreshToken);
  return {
    isValid: error ? false : true,
    errorMessage: error ? error.message : null,
    validatedValue: value,
  };
};

/**
 * Creates a new refresh token.
 * @param req The network request
 */
export const createNewRefreshToken = async (
  req: ExpressRequest
): Promise<void> => {
  const reqRefreshToken: RefreshToken = req.body;

  // Determines if the user's old refresh token is valid
  const { isValid, errorMessage, validatedValue } =
    validateOldRefreshToken(reqRefreshToken);

  if (isValid) {
    const dbSession = await connection.startSession();

    try {
      dbSession.startTransaction();
      const oldRefreshToken = await dbAuth.refreshTokensModel
        .findOne({ token: validatedValue.token })
        .session(dbSession);

      // If no refresh token was found or if it's expired
      if (
        !oldRefreshToken ||
        (oldRefreshToken && oldRefreshToken.isExpired())
      ) {
        // Deletes the entire token family if an expired token was given
        if (oldRefreshToken && oldRefreshToken.isExpired()) {
          const refreshTokenFamily =
            await dbAuth.refreshTokenFamiliesModel.findById(
              oldRefreshToken.familyId
            );
          let deletedRefreshTokenFamily = false;

          if (refreshTokenFamily) {
            deletedRefreshTokenFamily = await refreshTokenFamily.deleteFamily(
              dbSession
            );
          }

          if (!refreshTokenFamily || !deletedRefreshTokenFamily) {
            throw Error();
          }
        }

        throw Error(reqErrorMessages.invalidToken);
      }

      const refreshTokenUser = await oldRefreshToken.getUser(dbSession);
      if (!refreshTokenUser) {
        throw Error();
      }

      await oldRefreshToken.expireToken();
      const newAccessToken = refreshTokenUser.generateAccessToken();
      const newRefreshToken = await dbAuth.refreshTokensModel.createToken(
        refreshTokenUser.id,
        oldRefreshToken.familyId,
        dbSession
      );
      await dbSession.commitTransaction();

      if (newAccessToken && newRefreshToken) {
        RequestSuccess(req, refreshTokenUser.toPrivateJSON(), [
          // The access token
          {
            headerName: <string>process.env[envNames.jwt.accessReqHeader],
            headerValue: newAccessToken,
          },
          // The refresh token
          {
            headerName: <string>process.env[envNames.jwt.refreshReqHeader],
            headerValue: newRefreshToken.token,
          },
        ]);
      } else {
        throw Error();
      }
    } catch (error: any) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      // Invalid refresh token error
      if (error.message === reqErrorMessages.invalidToken) {
        RequestError(req, error).badRequest();
      } else {
        // Default error
        RequestError(
          req,
          Error("Failed to create a new refresh token.")
        ).server();
      }
    } finally {
      await dbSession.endSession();
    }
  } else {
    RequestError(req, Error(errorMessage || undefined)).validation();
  }
};
