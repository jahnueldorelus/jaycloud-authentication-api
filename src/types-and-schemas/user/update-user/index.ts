import { JoiValidationResults } from "@app-types/joi-validation";
import { PrivateUserData } from "..";

export type ValidUserUpdateInfo = JoiValidationResults<PrivateUserData>;
