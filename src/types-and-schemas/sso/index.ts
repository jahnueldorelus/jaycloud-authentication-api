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

export type SendToServiceData = {
  apiHost: string;
  apiUrl: string;
  apiMethod: "get" | "put" | "post" | "delete";
};

export type NewReqData = Partial<SendToServiceData> & {
  userId: string;
  token?: string;
};

export type ValidSendToServiceData = JoiValidationResults<SendToServiceData>;
