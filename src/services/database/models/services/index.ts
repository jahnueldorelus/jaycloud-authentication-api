import { model, Schema } from "mongoose";

import { PrivateServiceData } from "@app-types/database/models/services";
import {
  IService,
  IServiceMethods,
  DBLoadedService,
  ServicesModel,
} from "@app-types/database/models/services";

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
    api: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
    },
    portNumber: {
      type: Number,
      required: true,
      min: 0,
      max: 65536,
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
  },
  {
    timestamps: true,
  }
);

servicesSchema.method<DBLoadedService>("toPrivateJSON", function () {
  const privateJSON: PrivateServiceData = this.toJSON();
  delete privateJSON.api;
  delete privateJSON.portNumber;

  return privateJSON;
});

export const servicesModel = model<IService, ServicesModel>(
  "services",
  servicesSchema,
  "services"
);
