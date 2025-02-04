import { JoiValidationResults } from "@app-types/joi-validation";

export type ServiceUrl = {
  serviceUrl: string;
};

export type ValidServiceUrl = JoiValidationResults<ServiceUrl>;

export type RedirectToAuthUIResponse = {
  authUrl: string;
};

export type RedirectToServiceUIResponse = {
  serviceUrl: string;
};

export type SSOTokenResponse = {
  token: string;
};
