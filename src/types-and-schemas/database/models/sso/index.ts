import { HydratedDocument, Model } from "mongoose";

export type ISSO = {
  reqId: string;
  ssoId: string;
  userId: string | null;
  expDate: Date;
};

export type ISSOMethods = {};

export interface SSOModel extends Model<ISSO, {}, ISSOMethods> {}

export type DBLoadedSSO = HydratedDocument<ISSO, ISSOMethods>;
