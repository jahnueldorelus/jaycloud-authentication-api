import { RequestSuccess } from "@middleware/request-success";
import { envNames } from "@startup/config";
import { connection } from "mongoose";
import { dbAuth } from "@services/database";
import {
  getRequestUserData,
  requestIsAuthorized,
} from "@middleware/authorization";
import { ExpressRequestAndUser } from "@app-types/authorization";
import { CookieInfo, CookieRemoval } from "@app-types/request-success";
import { RedirectToServiceUIResponse } from "@app-types/user/sso";
import { RequestError } from "@middleware/request-error";
import { reqErrorMessages } from "@services/request-error-messages";

export const redirectToUiService = async (req: ExpressRequestAndUser) => {
  const dbSession = await connection.startSession();
  const reqUser = getRequestUserData(req);

  if (requestIsAuthorized(req) && reqUser) {
    try {
      dbSession.startTransaction();

      // Initial auth request cookie key
      const authReqCookieKey = <string>(
        process.env[envNames.cookie.initialAuthReq]
      );
      // Initial auth request id from cookie
      const initAuthReqId = req.signedCookies[authReqCookieKey];

      // SSO token cookie key
      const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];

      // Initial auth request service url cookie key
      const serviceUrlCookieKey = <string>(
        process.env[envNames.cookie.serviceUrl]
      );
      // Initial auth request id from cookie
      const serviceUrl = req.signedCookies[serviceUrlCookieKey];

      if (!initAuthReqId) {
        throw Error();
      }

      // Updates the initial auth request with the user's ID
      const ssoDoc = await dbAuth.ssoModel.findOneAndUpdate(
        { reqId: initAuthReqId },
        { userId: reqUser._id },
        { session: dbSession }
      );

      if (!ssoDoc) {
        throw Error();
      }

      await dbSession.commitTransaction();

      const authReqCookieDeleteInfo: CookieRemoval = {
        key: authReqCookieKey,
      };
      const serviceUrlCookieDeleteInfo: CookieRemoval = {
        key: serviceUrlCookieKey,
      };

      const ssoTokenCookieInfo: CookieInfo = {
        expDate: ssoDoc.expDate,
        key: ssoTokenCookieKey,
        value: ssoDoc.ssoId,
        sameSite: "lax",
      };

      RequestSuccess(
        req,
        <RedirectToServiceUIResponse>{
          serviceUrl,
        },
        null,
        null,
        [ssoTokenCookieInfo],
        [authReqCookieDeleteInfo, serviceUrlCookieDeleteInfo]
      );
    } catch (error: any) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      RequestError(req, Error(reqErrorMessages.serverError)).server();
    } finally {
      await dbSession.endSession();
    }
  } else {
    RequestError(req, Error(reqErrorMessages.forbiddenUser)).notAuthorized();
  }
};
