import { ExpressRequestAndUser } from "@app-types/authorization";
import { DataRequest, ValidDataRequest } from "@app-types/data";
import { ExtraHeaders } from "@app-types/request-success";
import { getRequestUserData } from "@middleware/authorization";
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
  const { error, value } = dataRequestSchema.validate(requestInfo);

  return {
    isValid: error ? false : true,
    errorMessage: error ? error.message : null,
    validatedValue: value,
  };
};

export const DataController: Controller = {
  transferRoute: async (req: ExpressRequest) => {
    const userData = getRequestUserData(<ExpressRequestAndUser>req);

    if (userData) {
      // The user's data request info
      const dataRequestInfo: DataRequest = req.body;

      // Determines if the user's data request is valid
      const { isValid, errorMessage, validatedValue } =
        validateDataRequest(dataRequestInfo);

      if (isValid) {
        try {
          // Adds the authorized user's info to the body of the request
          // req.body = { ...req.body, user: userData };

          const appAPIResponse = await axios({
            url: validatedValue.appApiUrl,
            method: req.method,
            data: req.body,
          });

          // Creates the response headers from the fetched app API
          const responseHeaders: ExtraHeaders = [];
          Object.keys(appAPIResponse.headers).forEach((headerName: string) => {
            const headerValue = appAPIResponse.headers[headerName];

            if (headerValue && headerName !== "access-control-expose-headers") {
              responseHeaders.push({ headerName, headerValue });
            }
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
