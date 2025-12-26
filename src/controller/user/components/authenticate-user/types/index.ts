import { JoiValidationResults } from "@app-types/joi-validation";
import { UserCredentials } from "@app-types/user/authenticate-user";

export type ValidUserCredentials = JoiValidationResults<UserCredentials>;
