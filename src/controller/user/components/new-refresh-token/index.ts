import Joi from "joi";
import { db } from "@services/database";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { reqErrorMessages } from "@services/request-error-messages";
import {
  RequestRefreshToken,
  ValidRefreshToken,
} from "@app-types/token/refresh-token";
import { envNames } from "@startup/config";
import { ExpressRequestAndUser } from "@app-types/authorization";
import { CookieRemoval } from "@app-types/request-success";
import { databaseQuery } from "@services/database/queries";

// Request body schema validation
const requestBodySchema = Joi.object({
  refreshToken: Joi.string().guid().required(),
});

/**
 * Deterimines if the user's refresh token is valid.
 * @param refreshToken The user's refresh token to validate
 */
function validateOldRefreshToken(
  refreshToken: RequestRefreshToken,
): ValidRefreshToken {
  const { error, value } = requestBodySchema.validate(refreshToken);

  if (error) {
    return {
      errorMessage: error.message,
      isValid: false,
      validatedValue: undefined,
    };
  } else {
    return { errorMessage: null, isValid: true, validatedValue: value };
  }
}

/**
 * Creates a new refresh token.
 * @param req The network request
 */
export async function createNewRefreshToken(
  req: ExpressRequestAndUser,
): Promise<void> {
  // Checks if the user has a valid sso token
  const ssoTokenKey: string = <string>process.env[envNames.cookie.ssoId];
  const ssoToken: string = <string>req.signedCookies[ssoTokenKey];
  const ssoTokenCookieDeleteInfo: CookieRemoval = {
    key: ssoTokenKey || "",
  };

  try {
    const ssoInfo = await db.ssoToken.getToken(ssoToken);

    if (databaseQuery.isFailedQueryResult(ssoInfo)) {
      if (ssoInfo.message === "invalid-request") {
        throw Error(reqErrorMessages.invalidToken);
      } else {
        throw Error(ssoInfo.message);
      }
    }

    // Determines if the user's old refresh token is valid
    const reqRefreshToken: RequestRefreshToken = req.body;
    const {
      isValid: refreshTokenIsValid,
      validatedValue: validatedReqRefreshToken,
    } = validateOldRefreshToken(reqRefreshToken);

    if (!refreshTokenIsValid) {
      RequestError(req, Error(reqErrorMessages.invalidToken), [
        ssoTokenCookieDeleteInfo,
      ]).validation();
    } else {
      const oldRefreshToken = await db.refreshToken.getRefreshTokenByKey(
        validatedReqRefreshToken.refreshToken,
      );

      if (databaseQuery.isFailedQueryResult(oldRefreshToken)) {
        if (oldRefreshToken.message === "bad-request") {
          throw Error(reqErrorMessages.invalidToken);
        } else {
          throw Error(reqErrorMessages.serverError);
        }
      }

      if (oldRefreshToken.tokenIsExpired) {
        await db.refreshTokenFamily.deleteFamily(oldRefreshToken.familyId);
        throw Error(reqErrorMessages.invalidToken);
      }

      const oldTokenIsExpired = await oldRefreshToken.expireToken();

      if (!oldTokenIsExpired) {
        throw Error(reqErrorMessages.serverError);
      }

      const refreshTokenUser = await oldRefreshToken.getUser();

      if (databaseQuery.isFailedQueryResult(refreshTokenUser)) {
        throw Error(reqErrorMessages.serverError);
      }

      const newAccessToken = refreshTokenUser.generateAccessToken();
      const refreshTokenOrigins =
        await refreshTokenUser.generateRefreshTokenOrigins();

      if (newAccessToken && refreshTokenOrigins) {
        RequestSuccess(req, refreshTokenUser.getPublicInfoJson(), [
          // The access token
          {
            headerName: <string>process.env[envNames.jwt.accessReqHeader],
            headerValue: newAccessToken,
          },
          // The refresh token
          {
            headerName: <string>process.env[envNames.jwt.refreshReqHeader],
            headerValue: refreshTokenOrigins.refreshToken.token,
          },
        ]);
      } else {
        throw Error(reqErrorMessages.serverError);
      }
    }
  } catch (error: any) {
    // Invalid sso or refresh token
    if (error.message === reqErrorMessages.invalidToken) {
      RequestError(req, error, [ssoTokenCookieDeleteInfo]).badRequest();
    }

    // Default error
    else {
      RequestError(req, Error(reqErrorMessages.serverError), [
        ssoTokenCookieDeleteInfo,
      ]).server();
    }
  }
}
