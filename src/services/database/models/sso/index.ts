import { model, Schema } from "mongoose";

import { ISSO, ISSOMethods, SSOModel } from "@app-types/database/models/sso";

/**
 * ANY CHANGES MADE TO THE SCHEMA MUST ALSO BE MADE IN MODEL'S TYPES
 */
const ssoSchema = new Schema<ISSO, SSOModel, ISSOMethods>(
  {
    reqId: {
      type: String,
      required: true,
      minlength: 59,
      maxlength: 60,
      unique: true,
    },
    ssoId: {
      type: String,
      required: true,
      minlength: 59,
      maxlength: 60,
    },
    userId: {
      type: String,
      required: false,
      minLength: 24,
      maxLength: 24,
      default: null,
    },
    expDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ssoModel = model<ISSO, SSOModel>("sso", ssoSchema, "sso");
