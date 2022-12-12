import { JoiValidationResults } from "@app-types/joi-validation";

export type UserEmailAndToken = {
  email: string;
  token: string;
};

export type ValidUserEmailAndToken = JoiValidationResults<UserEmailAndToken>;
