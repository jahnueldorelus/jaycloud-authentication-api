import { ExpressRequestAndUser } from "@app-types/authorization";
import { CookieRemoval } from "@app-types/request-success";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { db } from "@services/database";
import { envNames } from "@startup/config";
import Joi from "joi";
import {
  RequestRefreshToken,
  ValidRefreshToken,
} from "@app-types/token/refresh-token";
import { databaseQuery } from "@services/database/queries";

// Schema validation
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().guid().required(),
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

export async function signOutUser(req: ExpressRequestAndUser) {
  const refreshTokenData: RequestRefreshToken = req.body;

  const {
    isValid: isRefreshTokenValid,
    validatedValue: validatedRefreshToken,
  } = validateRefreshToken(refreshTokenData);

  const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];
  const ssoToken = <string>req.signedCookies[ssoTokenCookieKey];

  if (!isRefreshTokenValid || !ssoToken) {
    RequestError(req, Error()).notAuthorized();
  } else {
    try {
      const loadedRefreshToken = await db.refreshToken.getRefreshTokenByKey(
        validatedRefreshToken.refreshToken,
      );
      const loadedSsoToken = await db.ssoToken.getToken(ssoToken);

      if (databaseQuery.isFailedQueryResult(loadedRefreshToken)) {
        loadedRefreshToken.message === "bad-request"
          ? RequestError(req, Error()).notAuthorized()
          : RequestError(req, Error()).server();
      } else if (databaseQuery.isFailedQueryResult(loadedSsoToken)) {
        loadedSsoToken.message === "invalid-request"
          ? RequestError(req, Error()).notAuthorized()
          : RequestError(req, Error()).server();
      } else {
        const deletedRefreshTokenFamily =
          await db.refreshTokenFamily.deleteFamily(loadedRefreshToken.familyId);

        const deletedSsoToken = await db.ssoToken.deleteToken(
          loadedSsoToken.ssoKey,
        );

        if (!deletedRefreshTokenFamily || !deletedSsoToken) {
          throw Error();
        }

        const ssoCookieDeleteInfo: CookieRemoval = {
          key: ssoTokenCookieKey,
        };

        RequestSuccess(req, true, null, null, null, [ssoCookieDeleteInfo]);
      }
    } catch (error: any) {
      RequestError(
        req,
        Error("An error occurred logging out the user."),
      ).server();
    }
  }
}
