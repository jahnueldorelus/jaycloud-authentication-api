import { HydratedDocument, Model } from "mongoose";

// Makes some properties of the service's data optional to allow deletion
export type PrivateServiceData = Partial<IService> &
  Omit<IService, "portNumber" | "api">;

export type IService = {
  name: string;
  api: string;
  portNumber: number;
  logoFileName: string;
  description: string;
};

export type IServiceMethods = {
  /**
   * Generates a JSON that excludes a service's private information.
   */
  toPrivateJSON(): PrivateServiceData;
};

export interface ServicesModel extends Model<IService, {}, IServiceMethods> {}

export type DBLoadedService = HydratedDocument<IService, IServiceMethods>;
