import { JoiValidationResults } from "@app-types/joi-validation";

export type RefreshToken = {
  token: string;
};

export type ValidRefreshToken = JoiValidationResults<RefreshToken>;
