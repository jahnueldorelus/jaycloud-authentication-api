import { CookieRemoval } from "@app-types/request-success";
import { SSOTokenResponse } from "@app-types/sso";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { db } from "@services/database";
import { databaseQuery } from "@services/database/queries";
import { reqErrorMessages } from "@services/request-error-messages";
import { envNames } from "@startup/config";
import { Request as ExpressRequest } from "express";

/**
 * Attempts to retrieve a user's descrypted sso token.
 * @param req The express request
 */
export async function getSSOToken(req: ExpressRequest): Promise<void> {
  const authReqCookieKey = <string>process.env[envNames.cookie.initialAuthReq];
  const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];

  const initAuthReqCookieDeleteInfo: CookieRemoval = {
    key: authReqCookieKey,
  };
  const ssoTokenCookieDeleteInfo: CookieRemoval = {
    key: ssoTokenCookieKey,
  };

  try {
    const ssoKey = req.signedCookies[ssoTokenCookieKey];

    if (!ssoKey) {
      throw Error(reqErrorMessages.badRequest);
    }

    const ssoToken = await db.ssoToken.getToken(ssoKey);

    if (databaseQuery.isFailedQueryResult(ssoToken)) {
      if (ssoToken.message === "invalid-request") {
        throw Error(reqErrorMessages.forbiddenUser);
      } else {
        throw Error(reqErrorMessages.serverError);
      }
    }

    const decryptedSSOToken = ssoToken.getDecryptedToken();

    if (!decryptedSSOToken) {
      throw Error(reqErrorMessages.serverError);
    }

    RequestSuccess(
      req,
      <SSOTokenResponse>{
        token: decryptedSSOToken,
      },
      null,
      null,
      null,
      [initAuthReqCookieDeleteInfo]
    );
  } catch (error: any) {
    if (error.message === reqErrorMessages.forbiddenUser) {
      RequestError(req, Error(reqErrorMessages.forbiddenUser), [
        initAuthReqCookieDeleteInfo,
        ssoTokenCookieDeleteInfo,
      ]).forbidden();
    } else if (error.message === reqErrorMessages.badRequest) {
      RequestError(req, Error(reqErrorMessages.badRequest), [
        initAuthReqCookieDeleteInfo,
        ssoTokenCookieDeleteInfo,
      ]).badRequest();
    } else {
      RequestError(req, Error(reqErrorMessages.serverError), [
        initAuthReqCookieDeleteInfo,
        ssoTokenCookieDeleteInfo,
      ]).server();
    }
  }
}
