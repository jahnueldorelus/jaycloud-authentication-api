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
import { ExpressRequestAndUser } from "@app-types/authorization";
import { CookieRemoval } from "@app-types/request-success";

// Schema validation
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().guid().required(),
});

/**
 * Deterimines if the user's refresh token is valid.
 * @param refreshToken The user's refresh token to validate
 */
const validateOldRefreshToken = (
  refreshToken: RefreshToken
): ValidRefreshToken => {
  const { error, value } = refreshTokenSchema.validate(refreshToken);

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
 * Creates a new refresh token.
 * @param req The network request
 */
export const createNewRefreshToken = async (
  req: ExpressRequestAndUser
): Promise<void> => {
  // Checks if the user has a valid sso token
  const ssoTokenKey = process.env[envNames.cookie.ssoId];

  if (!ssoTokenKey) {
    throw Error();
  }
  const ssoToken = <string>req.signedCookies[ssoTokenKey];
  const ssoTokenCookieDeleteInfo: CookieRemoval = {
    key: ssoTokenKey || "",
  };

  const dbSession = await connection.startSession();

  try {
    const ssoDoc = await dbAuth.ssoModel.findOne({ ssoId: ssoToken });

    if (!ssoDoc) {
      throw Error(reqErrorMessages.invalidToken);
    }

    // Determines if the user's old refresh token is valid
    const reqRefreshToken: RefreshToken = req.body;
    const { isValid, validatedValue } =
      validateOldRefreshToken(reqRefreshToken);

    if (isValid) {
      dbSession.startTransaction();
      const oldRefreshToken = await dbAuth.refreshTokensModel
        .findOne({ token: validatedValue.refreshToken })
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
    } else {
      RequestError(req, Error(reqErrorMessages.invalidToken), [
        ssoTokenCookieDeleteInfo,
      ]).validation();
    }
  } catch (error: any) {
    // Invalid sso or refresh token
    if (error.message === reqErrorMessages.invalidToken) {
      RequestError(req, error, [ssoTokenCookieDeleteInfo]).badRequest();
    }

    // Default error
    else {
      RequestError(req, Error("Failed to create a new refresh token."), [
        ssoTokenCookieDeleteInfo,
      ]).server();
    }
  } finally {
    if (dbSession.inTransaction()) {
      await dbSession.abortTransaction();
    }

    await dbSession.endSession();
  }
};
