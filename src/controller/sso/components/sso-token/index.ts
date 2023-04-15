import { CookieInfo, CookieRemoval } from "@app-types/request-success";
import { SSOTokenResponse } from "@app-types/sso";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { dbAuth } from "@services/database";
import { reqErrorMessages } from "@services/request-error-messages";
import { envNames } from "@startup/config";
import { genSalt, hash } from "bcrypt";
import { randomUUID } from "crypto";
import { Request as ExpressRequest } from "express";
import { connection } from "mongoose";

export const getSSOToken = async (req: ExpressRequest) => {
  const dbSession = await connection.startSession();

  try {
    dbSession.startTransaction();

    // Initial auth request cookie key
    const authReqCookieKey = <string>(
      process.env[envNames.cookie.initialAuthReq]
    );
    // SSO token cookie key
    const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];
    // SSO token key from cookie
    const ssoToken = req.signedCookies[ssoTokenCookieKey];

    // Updates the initial auth request with the user's ID
    if (!ssoToken) {
      throw Error();
    }

    // Generates a salt for hashing
    const salt = await genSalt();
    const newSSOId = randomUUID();
    const newHashedSSOId = await hash(newSSOId, salt);

    const ssoDoc = await dbAuth.ssoModel.findOneAndUpdate(
      { ssoId: ssoToken },
      { ssoId: newHashedSSOId },
      {
        session: dbSession,
      }
    );

    if (!ssoDoc || !ssoDoc.userId) {
      throw Error();
    }

    await dbSession.commitTransaction();

    const initAuthReqCookieDeleteInfo: CookieRemoval = {
      key: authReqCookieKey,
    };

    const authSSOCookieInfo: CookieInfo = {
      key: ssoTokenCookieKey,
      value: newHashedSSOId,
      expDate: ssoDoc.expDate,
      sameSite: "lax",
    };

    RequestSuccess(
      req,
      <SSOTokenResponse>{
        token: newSSOId,
      },
      null,
      null,
      [authSSOCookieInfo],
      [initAuthReqCookieDeleteInfo]
    );
  } catch (error: any) {
    if (dbSession.inTransaction()) {
      await dbSession.abortTransaction();
    }

    RequestError(req, Error(reqErrorMessages.forbiddenUser)).notAuthorized();
  } finally {
    await dbSession.endSession();
  }
};
