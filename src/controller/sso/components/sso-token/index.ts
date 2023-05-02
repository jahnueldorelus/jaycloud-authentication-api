import { CookieRemoval } from "@app-types/request-success";
import { SSOTokenResponse } from "@app-types/sso";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { dbAuth } from "@services/database";
import { reqErrorMessages } from "@services/request-error-messages";
import { envNames } from "@startup/config";
import { Request as ExpressRequest } from "express";
import { connection } from "mongoose";

export const getSSOToken = async (req: ExpressRequest) => {
  const dbSession = await connection.startSession();

  const authReqCookieKey = <string>process.env[envNames.cookie.initialAuthReq];
  const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];

  const initAuthReqCookieDeleteInfo: CookieRemoval = {
    key: authReqCookieKey,
  };
  const ssoTokenCookieDeleteInfo: CookieRemoval = {
    key: ssoTokenCookieKey,
  };

  try {
    dbSession.startTransaction();

    // SSO token key from cookie
    const ssoToken = req.signedCookies[ssoTokenCookieKey];

    if (!ssoToken) {
      throw Error();
    }

    const ssoDoc = await dbAuth.ssoModel.findOne({ ssoId: ssoToken }, null, {
      session: dbSession,
    });

    if (!ssoDoc) {
      throw Error();
    }

    const decryptedSSOToken = dbAuth.ssoModel.getDecryptedToken(ssoDoc);

    if (!decryptedSSOToken) {
      throw Error();
    }

    await dbSession.commitTransaction();

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
    if (dbSession.inTransaction()) {
      await dbSession.abortTransaction();
    }

    RequestError(req, Error(reqErrorMessages.forbiddenUser), [
      initAuthReqCookieDeleteInfo,
      ssoTokenCookieDeleteInfo,
    ]).notAuthorized();
  } finally {
    await dbSession.endSession();
  }
};
