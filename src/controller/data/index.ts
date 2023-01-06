import { ExpressRequestAndUser } from "@app-types/authorization";
import { DataRequest, ValidDataRequest } from "@app-types/data";
import {
  getRequestUserData,
  requestPassedAuthorization,
} from "@middleware/authorization";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { Request as ExpressRequest } from "express";
import Joi from "joi";
import axios from "axios";
import { connection } from "mongoose";
import { dbAuth } from "@services/database";
import { reqErrorMessages } from "@services/request-error-messages";

type Controller = {
  transferRoute: (arg0: ExpressRequest) => Promise<void>;
};

/**
 * Schema validation.
 */
const dataRequestSchema = () =>
  Joi.object({
    serviceId: Joi.string().token().min(24).max(24).required(),
    apiPath: Joi.string().required(),
  });

/**
 * Deterimines if the user's data request is valid.
 * @param requestInfo The user's data request to validate
 */
const validateDataRequest = (requestInfo: DataRequest): ValidDataRequest => {
  const { error, value } = dataRequestSchema().validate(requestInfo, {
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
    if (requestPassedAuthorization(<ExpressRequestAndUser>req)) {
      // The user's data request info
      const dataRequestInfo: DataRequest = req.body;

      // Determines if the user's data request is valid
      const { isValid, errorMessage, validatedValue } =
        validateDataRequest(dataRequestInfo);

      const dbSession = await connection.startSession();

      if (isValid) {
        try {
          dbSession.startTransaction();
          const service = await dbAuth.servicesModel.findOne(
            { _id: validatedValue.serviceId },
            { apiPort: 1, apiUrl: 1, available: 1 },
            { session: dbSession }
          );
          await dbSession.commitTransaction();

          if (!service) {
            throw Error(reqErrorMessages.badRequest);
          }

          if (!service.available) {
            throw Error(reqErrorMessages.unavailable);
          }

          const newReqBody = req.body;

          // Adds the user's info to the new request's body
          const userData = getRequestUserData(<ExpressRequestAndUser>req);
          if (userData) {
            delete userData.exp;
            delete userData.iat;
            newReqBody.user = userData;
          }

          // Removes data from the new request's body that was required only for this server
          const dataRequestBody: Partial<DataRequest> = { ...newReqBody };
          delete dataRequestBody.apiPath;
          delete dataRequestBody.serviceId;

          const appAPIResponse = await axios({
            url: `${service.apiUrl}:${service.apiPort}${validatedValue.apiPath}`,
            method: req.method,
            data: dataRequestBody,
          });

          RequestSuccess(req, appAPIResponse.data);
        } catch (error: any) {
          if (dbSession.inTransaction()) {
            await dbSession.abortTransaction();
          }

          // Axios error
          if (axios.isAxiosError(error)) {
            RequestError(
              req,
              Error(
                "Error occurred with the destined server for the given request"
              )
            ).server();
          }
          // User provided an invalid service id
          else if (error.message === reqErrorMessages.badRequest) {
            RequestError(
              req,
              Error("The service id provided is invalid")
            ).badRequest();
          }
          // The service the user requested isn't available
          else if (error.message === reqErrorMessages.unavailable) {
            RequestError(
              req,
              Error(
                "The service requested is currently unavailable to take requests"
              )
            ).server();
          }
          // Default error message
          else {
            // Default error
            RequestError(req, Error("Failed to process the request")).server();
          }
        } finally {
          await dbSession.endSession();
        }
      } else {
        RequestError(req, Error(errorMessage || undefined)).validation();
      }
    }
  },
};
