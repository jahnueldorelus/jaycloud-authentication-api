import { JoiValidationResults } from "@app-types/joi-validation";

export type UserUpdateData = {
  firstName?: string;
  lastName?: string;
  password?: string;
};

export type ValidUserUpdateInfo = JoiValidationResults<UserUpdateData>;
