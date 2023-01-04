import { HydratedDocument, Model } from "mongoose";

export type IService = {
  name: string;
  api: string;
  portNumber: number;
  logoFileName: string;
  description: string;
  available: boolean;
};

export type IServiceMethods = {};

export interface ServicesModel extends Model<IService, {}, IServiceMethods> {}

export type DBLoadedService = HydratedDocument<IService, IServiceMethods>;
