import { ExpressRequestAndUser } from "@app-types/authorization";
import { CookieRemoval } from "@app-types/request-success";
import { requestIsAuthorized } from "@middleware/authorization";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { dbAuth } from "@services/database";
import { reqErrorMessages } from "@services/request-error-messages";
import { envNames } from "@startup/config";
import { connection } from "mongoose";

export const signOutUser = async (req: ExpressRequestAndUser) => {
  if (requestIsAuthorized(req)) {
    const dbSession = await connection.startSession();

    try {
      dbSession.startTransaction();

      const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];
      const ssoToken = req.signedCookies[ssoTokenCookieKey];
      const ssoDoc = await dbAuth.ssoModel.findOneAndDelete(
        { ssoId: ssoToken },
        {
          session: dbSession,
        }
      );

      if (!ssoDoc) {
        throw Error(reqErrorMessages.invalidToken);
      }

      const ssoCookieDeleteInfo: CookieRemoval = {
        key: ssoTokenCookieKey,
      };

      RequestSuccess(req, true, null, null, null, [ssoCookieDeleteInfo]);
    } catch (error: any) {
      // Invalid token error
      if (error.message === reqErrorMessages.invalidToken) {
        RequestError(req, Error(reqErrorMessages.invalidToken)).notAuthorized();
      }

      // Default error
      else {
        RequestError(req, Error(reqErrorMessages.serverError)).server();
      }
    }
  }
};
