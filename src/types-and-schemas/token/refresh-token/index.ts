import { JoiValidationResults } from "@app-types/joi-validation";

export type RequestRefreshToken = {
  refreshToken: string;
};

export type RequestAccessToken = {
  accessToken: string;
};

export type ValidRefreshToken = JoiValidationResults<RequestRefreshToken>;

export type ValidAccessToken = JoiValidationResults<RequestAccessToken>;
