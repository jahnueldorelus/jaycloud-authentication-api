import { JoiValidationResults } from "@app-types/joi-validation";
import { UserData } from "@app-types/user";

export type UserUpdateData = Pick<
  UserData,
  "firstName" | "lastName" | "password"
>;

export type ValidUserUpdateInfo = JoiValidationResults<UserUpdateData>;
