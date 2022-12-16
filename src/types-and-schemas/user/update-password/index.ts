import { JoiValidationResults } from "@app-types/joi-validation";

export type UpdatePasswordInfo = {
  email: string;
  password: string;
  token: string;
};

export type ValidUserEmailAndPassword =
  JoiValidationResults<UpdatePasswordInfo>;
