import { JoiValidationResults } from "@app-types/joi-validation";

export type UserCredentials = {
  password: string;
  email: string;
};

export type ValidCredentials = JoiValidationResults<UserCredentials>;
