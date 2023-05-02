import { Request as ExpressRequest } from "express";
import { RequestSuccess } from "@middleware/request-success";
import { envNames } from "@startup/config";
import { CookieRemoval } from "@app-types/request-success";
import { RequestError } from "@middleware/request-error";
import { reqErrorMessages } from "@services/request-error-messages";

export const redirectSignedOutUser = async (req: ExpressRequest) => {
  try {
    const serviceUrlCookieKey = <string>process.env[envNames.cookie.serviceUrl];

    const jayCloudAppUrl = <string>req.signedCookies[serviceUrlCookieKey];
    const authUiUrl =
      process.env[envNames.nodeEnv] === "production"
        ? process.env[envNames.origins.wanProd]
        : process.env[envNames.origins.wanDev];

    const serviceUrlCookieDeleteInfo: CookieRemoval = {
      key: serviceUrlCookieKey,
    };

    /**
     * Ensures that no redirection is done if the user originally made
     * a request to logout from a service and not the authentication ui
     */
    const redirectUrl =
      authUiUrl && jayCloudAppUrl.includes(authUiUrl) ? "" : jayCloudAppUrl;

    RequestSuccess(req, redirectUrl, null, null, null, [
      serviceUrlCookieDeleteInfo,
    ]);
  } catch (error: any) {
    // Default error
    RequestError(req, Error(reqErrorMessages.badRequest)).badRequest();
  }
};
