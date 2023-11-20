import { RequestSuccess } from "@middleware/request-success";
import { envNames } from "@startup/config";
import { connection } from "mongoose";
import {
  getRequestUserData,
  requestIsAuthorized,
} from "@middleware/authorization";
import { ExpressRequestAndUser } from "@app-types/authorization";
import { CookieRemoval } from "@app-types/request-success";
import { RedirectToServiceUIResponse } from "@app-types/sso";
import { RequestError } from "@middleware/request-error";
import { reqErrorMessages } from "@services/request-error-messages";

export const redirectToServiceUi = async (req: ExpressRequestAndUser) => {
  const dbSession = await connection.startSession();
  const reqUser = getRequestUserData(req);

  if (requestIsAuthorized(req) && reqUser) {
    try {
      dbSession.startTransaction();

      const serviceUrlCookieKey = <string>(
        process.env[envNames.cookie.serviceUrl]
      );

      const serviceUrl = req.signedCookies[serviceUrlCookieKey];

      await dbSession.commitTransaction();

      const serviceUrlCookieDeleteInfo: CookieRemoval = {
        key: serviceUrlCookieKey,
      };

      RequestSuccess(
        req,
        <RedirectToServiceUIResponse>{
          serviceUrl,
        },
        null,
        null,
        null,
        [serviceUrlCookieDeleteInfo]
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
