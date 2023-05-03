import { model, Schema } from "mongoose";

import {
  DBLoadedService,
  IService,
  IServiceMethods,
  ServicesModel,
} from "@app-types/database/models/services";
import { PrivateServiceData } from "@app-types/service";
import { envNames } from "@startup/config";

/**
 * ANY CHANGES MADE TO THE SCHEMA MUST ALSO BE MADE IN MODEL'S TYPES
 */
const servicesSchema = new Schema<IService, ServicesModel, IServiceMethods>(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
    },
    prodApiUrl: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
      unique: true,
    },
    devApiUrl: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
      unique: true,
    },
    prodUiUrl: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
      unique: true,
    },
    devUiUrl: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
      unique: true,
    },
    logoFileName: {
      type: String,
      required: true,
      minlength: 3,
    },
    description: {
      type: String,
      required: true,
      minlength: 3,
    },
    available: {
      type: Boolean,
      required: true,
    },
    localApiUrl: {
      type: String,
      required: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

servicesSchema.method<DBLoadedService>("toPrivateJSON", function () {
  const currentEnv = process.env[envNames.nodeEnv];

  const privateServiceInfo: PrivateServiceData = {
    _id: this.id,
    available: this.available,
    description: this.description,
    name: this.name,
    uiUrl: currentEnv === "production" ? this.prodUiUrl : this.devUiUrl,
  };

  return privateServiceInfo;
});

export const servicesModel = model<IService, ServicesModel>(
  "services",
  servicesSchema,
  "services"
);
