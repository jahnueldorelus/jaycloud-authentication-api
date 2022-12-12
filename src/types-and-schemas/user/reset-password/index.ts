import { JoiValidationResults } from "@app-types/joi-validation";

export type UserEmail = {
  email: string;
};

export type ValidUserEmail = JoiValidationResults<UserEmail>;
