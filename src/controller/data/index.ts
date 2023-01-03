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

type Controller = {
  transferRoute: (arg0: ExpressRequest) => Promise<void>;
};

/**
 * Schema validation.
 * @param servicesList The list of available services to send a request to
 */
const dataRequestSchema = (servicesList: string[]) =>
  Joi.object({
    app: Joi.string()
      .valid(...servicesList)
      .required(),
    appApiPath: Joi.string().uri().required(),
  });

/**
 * Deterimines if the user's data request is valid.
 * @param servicesList The list of available services to send a request to
 * @param requestInfo The user's data request to validate
 */
const validateDataRequest = (
  servicesList: string[],
  requestInfo: DataRequest
): ValidDataRequest => {
  const { error, value } = dataRequestSchema(servicesList).validate(
    requestInfo,
    {
      allowUnknown: true,
    }
  );

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

      const dbSession = await connection.startSession();

      try {
        dbSession.startTransaction();
        const servicesList = await dbAuth.servicesModel.find(
          {},
          { name: 1, _id: 0 },
          { session: dbSession }
        );
        await dbSession.commitTransaction();

        // Determines if the user's data request is valid
        const { isValid, errorMessage, validatedValue } = validateDataRequest(
          servicesList.map((service) => service.name),
          dataRequestInfo
        );

        if (isValid) {
          try {
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
            delete dataRequestBody.app;
            delete dataRequestBody.appApiPath;

            const appAPIResponse = await axios({
              url: validatedValue.appApiPath,
              method: req.method,
              data: dataRequestBody,
            });

            RequestSuccess(req, appAPIResponse.data);
          } catch (error: any) {
            if (axios.isAxiosError(error)) {
              RequestError(
                req,
                Error(
                  "Error occurred with the destined server for the given request"
                )
              ).server();
            } else {
              // Default error
              RequestError(
                req,
                Error("Failed to process the request")
              ).server();
            }
          }
        } else {
          RequestError(req, Error(errorMessage || undefined)).validation();
        }
      } catch (error) {
        if (dbSession.inTransaction()) {
          await dbSession.abortTransaction();
        }

        RequestError(req, Error("Failed to process the request")).server();
      } finally {
        await dbSession.endSession();
      }
    }
  },
};
