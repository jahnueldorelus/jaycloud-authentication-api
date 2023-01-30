import { DBLoadedUser } from "@app-types/database/models/users";
import { Request } from "express";

export interface ExpressRequestAndUser extends Request {
  user: DBLoadedUser;
}
