import { JoiValidationResults } from "@app-types/joi-validation";

export type RefreshToken = {
  refreshToken: string;
};

export type ValidRefreshToken = JoiValidationResults<RefreshToken>;
