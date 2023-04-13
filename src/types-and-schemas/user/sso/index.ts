import { JoiValidationResults } from "@app-types/joi-validation";

export type ServiceInfo = {
  serviceUrl: string;
};

export type ValidServiceUrl = JoiValidationResults<ServiceInfo>;

export type RedirectToAuthUIResponse = {
  authUrl: string;
};

export type RedirectToServiceUIResponse = {
  serviceUrl: string;
};

export type SSOTokenResponse = {
  token: string;
};
