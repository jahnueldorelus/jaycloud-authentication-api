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
 * Attempts to retrieve the
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
    // SSO token key from cookie
    const ssoKey = req.signedCookies[ssoTokenCookieKey];

    if (!ssoKey) {
      throw Error();
    }

    const ssoToken = await db.ssoToken.getToken(ssoKey);

    if (databaseQuery.isFailedQueryResult(ssoToken)) {
      throw Error();
    }

    const decryptedSSOToken = ssoToken.getDecryptedToken();

    if (!decryptedSSOToken) {
      throw Error();
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
    RequestError(req, Error(reqErrorMessages.forbiddenUser), [
      initAuthReqCookieDeleteInfo,
      ssoTokenCookieDeleteInfo,
    ]).notAuthorized();
  }
}
