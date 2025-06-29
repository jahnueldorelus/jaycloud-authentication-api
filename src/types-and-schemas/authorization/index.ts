import { JoiValidationResults } from "@app-types/joi-validation";
import { LoadedUser } from "@services/database/table-models/loaded-user";
import { Request } from "express";

export interface ExpressRequestAndUser extends Request {
  user: LoadedUser;
}

export type SSOToken = {
  token: string;
};

export type ValidSSOToken = JoiValidationResults<SSOToken>;
