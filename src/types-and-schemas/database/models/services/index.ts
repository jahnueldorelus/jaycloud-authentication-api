import { PrivateServiceData } from "@app-types/service";
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

export type IServiceMethods = {
 /**
   * Generates a JSON that excludes a service's private information.
   */
 toPrivateJSON(): PrivateServiceData;
};

export interface ServicesModel extends Model<IService, {}, IServiceMethods> {}

export type DBLoadedService = HydratedDocument<IService, IServiceMethods>;
