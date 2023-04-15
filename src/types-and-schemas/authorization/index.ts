import { DBLoadedUser } from "@app-types/database/models/users";
import { JoiValidationResults } from "@app-types/joi-validation";
import { Request } from "express";

export interface ExpressRequestAndUser extends Request {
  user: DBLoadedUser;
}

export type SSOToken = {
  token: string;
};

export type ValidSSOToken = JoiValidationResults<SSOToken>;
