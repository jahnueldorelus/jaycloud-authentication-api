import { JoiValidationResults } from "@app-types/joi-validation";

export type RequestRefreshToken = {
  refreshToken: string;
};

export type ValidRefreshToken = JoiValidationResults<RequestRefreshToken>;
