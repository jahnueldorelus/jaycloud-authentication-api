import { Request as ExpressRequest } from "express";
import { RequestSuccess } from "@middleware/request-success";
import { envNames } from "@startup/config";
import { CookieRemoval } from "@app-types/request-success";

/**
 * Attempts to redirect the signed out user to the service they were
 * on before they were signed out. If they were already on the authentication ui,
 * they will not be redirected to any service.
 * @param req The express request
 */
export function redirectSignedOutUser(req: ExpressRequest): void {
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
   * a request to logout the authentication ui and not from a service
   */
  const redirectUrl =
    authUiUrl && jayCloudAppUrl && jayCloudAppUrl.includes(authUiUrl)
      ? ""
      : jayCloudAppUrl;

  RequestSuccess(req, redirectUrl, null, null, null, [
    serviceUrlCookieDeleteInfo,
  ]);
}
