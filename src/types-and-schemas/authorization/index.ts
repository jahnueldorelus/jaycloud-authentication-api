import { TokenData } from "@app-types/token/access-token";
import { Request } from "express";

export interface ExpressRequestAndUser extends Request {
  user: TokenData;
}
