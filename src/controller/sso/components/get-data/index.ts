import { ExpressRequestAndUser } from "@app-types/authorization";
import { requestIsAuthorized } from "@middleware/authorization";
import { RequestError } from "@middleware/request-error";
import { dbAuth } from "@services/database";
import { reqErrorMessages } from "@services/request-error-messages";
import { connection } from "mongoose";
import Joi from "joi";
import {
  NewReqData,
  SendToServiceData,
  ValidSendToServiceData,
} from "@app-types/sso";
import axios from "axios";
import { envNames } from "@startup/config";
import { RequestSuccess } from "@middleware/request-success";
import { cloneDeep } from "lodash";

// Schema validation
const getDataValidationSchema = Joi.object({
  apiHost: Joi.string().uri().required(),
  apiUrl: Joi.string().uri().required(),
  apiMethod: Joi.string()
    .lowercase()
    .allow("get", "put", "post", "delete")
    .required(),
});

/**
 * Deterimines if the request's data is valid.
 * @param data The request's data
 */
const validateRequestData = (
  reqData: SendToServiceData
): ValidSendToServiceData => {
  const { error, value } = getDataValidationSchema.validate(reqData, {
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
};

export const getData = async (req: ExpressRequestAndUser) => {
  if (requestIsAuthorized(req)) {
    const requestData: SendToServiceData = req.body;

    const { isValid, validatedValue, errorMessage } =
      validateRequestData(requestData);

    // If the request's data is valid
    if (isValid) {
      const dbSession = await connection.startSession();
      dbSession.startTransaction();

      try {
        const service = await dbAuth.servicesModel.findOne(
          {
            $or: [
              { prodApiUrl: validatedValue.apiHost },
              { devApiUrl: validatedValue.apiHost },
            ],
          },
          null,
          { session: dbSession }
        );

        await dbSession.commitTransaction();

        const originDomain = <string>process.env[envNames.origins.domain];

        // If a request was made to be sent to a non JayCloud service url
        if (!service || !validatedValue.apiUrl.includes(originDomain)) {
          throw Error(reqErrorMessages.badRequest);
        }

        /**
         * Removes unneeded request body info before sending the
         * request to the JayCloud service API
         */
        const newReqData = <NewReqData>cloneDeep(validatedValue);
        delete newReqData.apiHost;
        delete newReqData.apiMethod;
        delete newReqData.apiUrl;
        delete newReqData.token;
        newReqData.userId = req.user.id;

        // The origin header for CORS to pass on the JayCloud service API
        const apiOriginHeader =
          process.env[envNames.nodeEnv] === "production"
            ? process.env[envNames.origins.apiProd]
            : process.env[envNames.origins.apiDev];

        const serviceApiPath = validatedValue.apiUrl.slice(
          validatedValue.apiHost.length
        );
        const serviceApiUrl = service.localApiUrl + serviceApiPath;

        // Sends the request to the JayCloud service API
        const response = await axios(serviceApiUrl, {
          method: validatedValue.apiMethod,
          data: <object>newReqData,
          headers: {
            Origin: apiOriginHeader,
          },
        });

        // If the JayCloud service API request fails
        if (axios.isAxiosError(response)) {
          RequestError(req, Error(response.message)).badRequest();
        }

        // If the JayCloud service API request passes
        else {
          RequestSuccess(req, response.data);
        }
      } catch (error: any) {
        if (dbSession.inTransaction()) {
          await dbSession.abortTransaction();
        }

        // If the service requested doesn't exist
        if (error.message === reqErrorMessages.badRequest) {
          RequestError(req, Error(reqErrorMessages.badRequest)).notAuthorized();
        }

        // Default error
        else {
          RequestError(req, Error(reqErrorMessages.serverError)).server();
        }
      } finally {
        await dbSession.endSession();
      }
    } // If the request data is invalid
    else {
      RequestError(req, Error(errorMessage)).badRequest();
    }
  }
};
