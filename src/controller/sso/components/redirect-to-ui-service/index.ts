import { RequestSuccess } from "@middleware/request-success";
import { envNames } from "@startup/config";
import {
  getRequestUserData,
  requestIsAuthorized,
} from "@middleware/authorization";
import { ExpressRequestAndUser } from "@app-types/authorization";
import { CookieRemoval } from "@app-types/request-success";
import { RedirectToServiceUIResponse } from "@app-types/sso";
import { RequestError } from "@middleware/request-error";
import { reqErrorMessages } from "@services/request-error-messages";

/**
 * Attempts to redicrect the authentication service UI to the original
 * service UI that requested authentication.
 * @param req The express request
 */
export function redirectToServiceUi(req: ExpressRequestAndUser): void {
  const reqUser = getRequestUserData(req);

  if (requestIsAuthorized(req) && reqUser) {
    const serviceUrlCookieKey = <string>process.env[envNames.cookie.serviceUrl];

    const serviceUrl = req.signedCookies[serviceUrlCookieKey];

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
  } else {
    RequestError(req, Error(reqErrorMessages.forbiddenUser)).notAuthorized();
  }
}
