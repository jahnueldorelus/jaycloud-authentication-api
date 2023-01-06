import { HydratedDocument, Model } from "mongoose";

export type IService = {
  name: string;
  apiUrl: string;
  apiPort: number;
  uiUrl: string;
  uiPort: number;
  logoFileName: string;
  description: string;
  available: boolean;
};

export type IServiceMethods = {};

export interface ServicesModel extends Model<IService, {}, IServiceMethods> {}

export type DBLoadedService = HydratedDocument<IService, IServiceMethods>;
