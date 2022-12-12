import { JoiValidationResults } from "@app-types/joi-validation";

export type UserEmailAndPassword = {
  email: string;
  password: string;
};

export type ValidUserEmailAndPassword =
  JoiValidationResults<UserEmailAndPassword>;
