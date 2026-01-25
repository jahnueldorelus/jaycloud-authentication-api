import { ExpressRequestAndUser } from "@app-types/authorization";
import { CookieRemoval } from "@app-types/request-success";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { db } from "@services/database";
import { envNames } from "@startup/config";
import Joi from "joi";
import {
  RequestAccessToken,
  RequestRefreshToken,
  ValidAccessToken,
  ValidRefreshToken,
} from "@app-types/token/refresh-token";
import { databaseQuery } from "@services/database/queries";

// Schema validation
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().guid().required(),
});

// Schema validation
const accessTokenSchema = Joi.object({
  accessToken: Joi.string().required(),
});

/**
 * Deterimines if the user's refresh token is valid.
 * @param refreshToken The user's refresh token to validate
 */
function validateRefreshToken(
  refreshToken: RequestRefreshToken,
): ValidRefreshToken {
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
}

/**
 * Deterimines if the user's access token is valid.
 * @param accessToken The user's access token to validate
 */
function validateAccessToken(
  accessToken: RequestAccessToken,
): ValidAccessToken {
  const { error, value } = accessTokenSchema.validate(accessToken);

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

export async function signOutUser(req: ExpressRequestAndUser) {
  const refreshTokenData: RequestRefreshToken = req.body;
  const accessTokenData: RequestAccessToken = { accessToken: req.token || "" };

  const {
    isValid: isRefreshTokenValid,
    errorMessage: refreshTokenErrorMessage,
    validatedValue: validatedRefreshToken,
  } = validateRefreshToken(refreshTokenData);
  const {
    isValid: isAccessTokenValid,
    errorMessage: accessTokenErrorMessage,
    validatedValue: validatedAccessToken,
  } = validateAccessToken(accessTokenData);

  // If the request's service information is valid
  if (isRefreshTokenValid && isAccessTokenValid) {
    try {
      const loadedRefreshToken = await db.refreshToken.getRefreshTokenByKey(
        validatedRefreshToken.refreshToken,
      );
      const loadedAccessToken = await db.ssoToken.getToken(
        validatedAccessToken.accessToken,
      );

      /**
       * Deletes all refresh tokens that are a part of the given refresh token's family
       * and the refresh family token itself
       */
      if (databaseQuery.isFailedQueryResult(loadedRefreshToken)) {
        loadedRefreshToken.message === "bad-request"
          ? RequestError(req, Error()).notAuthorized()
          : RequestError(req, Error()).server();
      } else if (databaseQuery.isFailedQueryResult(loadedAccessToken)) {
        loadedAccessToken.message === "invalid-request"
          ? RequestError(req, Error()).notAuthorized()
          : RequestError(req, Error()).server();
      } else {
        const deletedRefreshTokenFamily =
          await db.refreshTokenFamily.deleteFamily(loadedRefreshToken.familyId);

        const deletedSsoToken = await db.ssoToken.deleteToken(
          loadedAccessToken.ssoKey,
        );

        if (!deletedRefreshTokenFamily || !deletedSsoToken) {
          throw Error();
        } else {
          const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];
          const ssoToken = req.signedCookies[ssoTokenCookieKey];

          await db.ssoToken.deleteToken(ssoToken);

          const ssoCookieDeleteInfo: CookieRemoval = {
            key: ssoTokenCookieKey,
          };

          RequestSuccess(req, true, null, null, null, [ssoCookieDeleteInfo]);
        }
      }
    } catch (error: any) {
      // Default error
      RequestError(
        req,
        Error("An error occurred logging out the user."),
      ).server();
    }
  }
  // If the given request info is invalid
  else {
    const errorMessage =
      refreshTokenErrorMessage || accessTokenErrorMessage || "";

    RequestError(req, Error(errorMessage)).notAuthorized();
  }
}
