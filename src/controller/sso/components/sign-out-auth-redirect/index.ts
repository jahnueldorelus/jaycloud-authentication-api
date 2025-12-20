import { ExpressRequestAndUser } from "@app-types/authorization";
import { CookieInfo } from "@app-types/request-success";
import { requestIsAuthorized } from "@middleware/authorization";
import { RequestSuccess } from "@middleware/request-success";
import { envNames } from "@startup/config";
import Joi from "joi";
import { ServiceUrl, ValidServiceUrl } from "@app-types/sso";
import { RequestError } from "@middleware/request-error";

// Schema validation
const serviceUrlSchema = Joi.object({
  serviceUrl: Joi.string().uri().required(),
});

/**
 * Deterimines if the request's data is valid.
 * @param serviceUrl The service url to validate
 */
function validateServiceUrl(serviceUrl: ServiceUrl): ValidServiceUrl {
  const { error, value } = serviceUrlSchema.validate(serviceUrl, {
    allowUnknown: true,
  });

  if (error) {
    return {
      errorMessage: error.message,
      isValid: false,
      validatedValue: undefined,
    };
  } else {
    return { errorMessage: null, isValid: true, validatedValue: value };
  }
}

/**
 * Retrieves the URL for a service to request signing out the currently
 * authorized user.
 * @param req The express request
 */
export function signOutAuthRedirect(req: ExpressRequestAndUser): void {
  if (requestIsAuthorized(req)) {
    const requestData: ServiceUrl = req.body;

    const { isValid, errorMessage, validatedValue } =
      validateServiceUrl(requestData);

    // If the request's service information is valid
    if (isValid) {
      const serviceUrlCookieKey = <string>(
        process.env[envNames.cookie.serviceUrl]
      );
      const serviceUrlCookieInfo: CookieInfo = {
        key: serviceUrlCookieKey,
        value: validatedValue.serviceUrl,
        sameSite: "lax",
      };

      const signOutAuthUrl =
        process.env[envNames.nodeEnv] === "production"
          ? process.env[envNames.origins.wanProd]
          : process.env[envNames.origins.wanDev];

      RequestSuccess(req, `${signOutAuthUrl}/logout`, null, null, [
        serviceUrlCookieInfo,
      ]);
    }

    // If the given request info is invalid
    else {
      RequestError(req, Error(errorMessage)).validation();
    }
  }
  // If the given request info is unauthorized
  else {
    RequestError(req, Error()).notAuthorized();
  }
}
