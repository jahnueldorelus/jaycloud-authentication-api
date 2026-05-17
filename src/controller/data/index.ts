import { ExpressRequestAndUser } from "@app-types/authorization";
import { DataRequest, ValidDataRequest } from "@app-types/data";
import {
  getRequestUserData,
  requestAfterAuthCanBeProcessed,
} from "@middleware/authorization";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { Request as ExpressRequest } from "express";
import Joi from "joi";
import axios from "axios";
import { db } from "@services/database";
import { reqErrorMessages } from "@services/request-error-messages";
import { envNames } from "@startup/config";
import { databaseQuery } from "@services/database/queries";

type Controller = {
  transferRoute: (arg0: ExpressRequest) => Promise<void>;
};

/**
 * Schema validation.
 */
const dataRequestSchema = Joi.object({
  serviceId: Joi.number().required(),
  apiPath: Joi.string().required(),
  apiMethod: Joi.string()
    .valid(
      "get",
      "GET",
      "post",
      "POST",
      "put",
      "PUT",
      "patch",
      "PATCH",
      "delete",
      "DELETE",
    )
    .required(),
});

/**
 * Deterimines if the user's data request is valid.
 * @param requestInfo The user's data request to validate
 */
function validateDataRequest(requestInfo: DataRequest): ValidDataRequest {
  const { error, value } = dataRequestSchema.validate(requestInfo, {
    allowUnknown: true,
  });

  if (error) {
    return {
      errorMessage: error.message,
      isValid: false,
      validatedValue: undefined,
    };
  } else {
    return { errorMessage: null, isValid: true, validatedValue: value };
  }
}

/**
 * Transfers an api request to a registered online service.
 * @param req The express request
 */
async function transferRoute(req: ExpressRequest) {
  if (requestAfterAuthCanBeProcessed(<ExpressRequestAndUser>req)) {
    const dataRequestInfo: DataRequest = req.body;

    const { isValid, errorMessage, validatedValue } =
      validateDataRequest(dataRequestInfo);

    if (isValid) {
      const serviceId: number = validatedValue.serviceId;

      try {
        const service = await db.service.getOneService(serviceId);

        if (databaseQuery.isFailedQueryResult(service)) {
          throw Error(reqErrorMessages.badRequest);
        }

        if (!service.isOnline) {
          throw Error(reqErrorMessages.unavailable);
        }

        const newReqBody = req.body;

        // Adds the user's info to the new request's body
        const userData = getRequestUserData(<ExpressRequestAndUser>req);
        if (userData) {
          newReqBody.user = userData.getPublicInfoJson();
        }

        // Removes data from the new request's body that was required only for this server
        const dataRequestBody: Partial<DataRequest> = { ...newReqBody };
        delete dataRequestBody.apiPath;
        delete dataRequestBody.serviceId;

        const currentEnv = process.env[envNames.nodeEnv];

        const requestUrl = `${
          currentEnv === "production" ? service.prodApiUrl : service.devApiUrl
        }${validatedValue.apiPath}`;

        const appAPIResponse = await axios({
          url: requestUrl,
          method: validatedValue.apiMethod,
          data: dataRequestBody,
        });

        RequestSuccess(req, appAPIResponse.data);
      } catch (error: any) {
        // Axios error
        if (axios.isAxiosError(error)) {
          RequestError(req, Error(error.message)).server();
        }
        // User provided an invalid service id
        else if (error.message === reqErrorMessages.badRequest) {
          RequestError(
            req,
            Error("The service id provided is invalid"),
          ).badRequest();
        }
        // The service the user requested isn't available
        else if (error.message === reqErrorMessages.unavailable) {
          RequestError(
            req,
            Error(
              "The service requested is currently unavailable to take requests",
            ),
          ).badRequest();
        }
        // Default error message
        else {
          // Default error
          RequestError(
            req,
            error.message || Error("Failed to process the request"),
          ).server();
        }
      }
    } else {
      RequestError(req, Error(errorMessage)).validation();
    }
  }
}

export const DataController: Controller = {
  transferRoute,
};
