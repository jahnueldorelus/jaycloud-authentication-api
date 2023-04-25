import { HydratedDocument, Model } from "mongoose";

export type IService = {
  name: string;
  prodApiUrl: string;
  devApiUrl: string;
  prodUiUrl: string;
  devUiUrl: string;
  logoFileName: string;
  description: string;
  available: boolean;
  localApiUrl: string | null;
};

export type IServiceMethods = {};

export interface ServicesModel extends Model<IService, {}, IServiceMethods> {}

export type DBLoadedService = HydratedDocument<IService, IServiceMethods>;

export interface UIRequestService extends Partial<DBLoadedService> {
  uiUrl: string;
}
