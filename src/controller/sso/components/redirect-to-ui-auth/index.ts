import { RequestSuccess } from "@middleware/request-success";
import { envNames } from "@startup/config";
import { Request as ExpressRequest } from "express";
import { RequestError } from "@middleware/request-error";
import Joi from "joi";
import {
  RedirectToAuthUIResponse,
  ServiceUrl,
  ValidServiceUrl,
} from "@app-types/sso";
import { CookieInfo } from "@app-types/request-success";

// Schema validation
const initialAuthReqSchema = Joi.object({
  serviceUrl: Joi.string().uri().required(),
});

/**
 * Deterimines if the request's service's information is valid.
 * @param serviceInfo The request's service information
 */
const validateServiceInfo = (serviceInfo: ServiceUrl): ValidServiceUrl => {
  const { error, value } = initialAuthReqSchema.validate(serviceInfo, {
    allowUnknown: false,
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
};

export const redirectToAuthUi = async (req: ExpressRequest) => {
  const requestData: ServiceUrl = req.body;

  const { isValid, errorMessage, validatedValue } =
    validateServiceInfo(requestData);

  // If the request's service information is valid
  if (isValid) {
    const authUrl =
      process.env[envNames.nodeEnv] === "production"
        ? process.env[envNames.origins.wanProd]
        : process.env[envNames.origins.wanDev];

    // Initial auth request service url cookie key
    const serviceUrlCookieKey = <string>process.env[envNames.cookie.serviceUrl];

    const serviceUrlCookieInfo: CookieInfo = {
      key: serviceUrlCookieKey,
      value: validatedValue.serviceUrl,
      sameSite: "strict",
    };

    RequestSuccess(
      req,
      <RedirectToAuthUIResponse>{
        authUrl: authUrl + "/login?sso=true",
      },
      null,
      null,
      [serviceUrlCookieInfo]
    );
  }
  // If the given service info from the request is invalid
  else {
    RequestError(req, Error(errorMessage)).validation();
  }
};
