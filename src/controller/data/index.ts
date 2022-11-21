import { ExpressRequestAndUser } from "@app-types/authorization";
import { DataRequest, ValidDataRequest } from "@app-types/data";
import {
  getRequestUserData,
  requestCanBeProcessed,
} from "@middleware/authorization";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { Request as ExpressRequest } from "express";
import Joi from "joi";
import axios from "axios";

type Controller = {
  transferRoute: (arg0: ExpressRequest) => Promise<void>;
};

const dataRequestSchema = Joi.object({
  app: Joi.string()
    .valid("jaylock", "jayblog", "chants-desperance", "jayheart", "jayspark")
    .required(),
  appApiUrl: Joi.string().uri().required(),
});

/**
 * Deterimines if the user's data request is valid.
 * @param requestInfo The user's dataa request to validate
 */
const validateDataRequest = (requestInfo: DataRequest): ValidDataRequest => {
  const { error, value } = dataRequestSchema.validate(requestInfo, {
    allowUnknown: true,
  });

  return {
    isValid: error ? false : true,
    errorMessage: error ? error.message : null,
    validatedValue: value,
  };
};

export const DataController: Controller = {
  transferRoute: async (req: ExpressRequest) => {
    if (requestCanBeProcessed(<ExpressRequestAndUser>req)) {
      // The user's data request info
      const dataRequestInfo: DataRequest = req.body;

      // Determines if the user's data request is valid
      const { isValid, errorMessage, validatedValue } =
        validateDataRequest(dataRequestInfo);

      if (isValid) {
        try {
          const newReqBody = { ...req.body };

          // Adds the user's info to the new request's body
          const userData = getRequestUserData(<ExpressRequestAndUser>req);
          if (userData) {
            delete userData.exp;
            delete userData.iat;
            newReqBody.user = userData;
          }

          // Removes data from the new request body that was required only for this server
          const dataRequestBody: Partial<DataRequest> = newReqBody;
          delete dataRequestBody.app;
          delete dataRequestBody.appApiUrl;

          const appAPIResponse = await axios({
            url: validatedValue.appApiUrl,
            method: req.method,
            data: dataRequestBody,
          });

          RequestSuccess(req, appAPIResponse.data);
        } catch (error: any) {
          if (axios.isAxiosError(error)) {
            RequestError(
              req,
              Error(
                // "Error occurred with the destined server for the given request"
                error.message
              )
            ).server();
          } else {
            // Default error
            RequestError(req, Error("Failed to process the request")).server();
          }
        }
      } else {
        RequestError(req, Error(errorMessage || undefined)).validation();
      }
    }
  },
};
