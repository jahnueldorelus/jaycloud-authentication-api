import { JoiValidationResults } from "@app-types/joi-validation";

export type UpdatePasswordInfo = {
  password: string;
  token: string;
};

export type ValidUserEmailAndPassword =
  JoiValidationResults<UpdatePasswordInfo>;
