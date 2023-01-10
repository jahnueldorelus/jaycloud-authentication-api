import { Express, json, urlencoded } from "express";
import helmet from "helmet";
import bearerToken from "express-bearer-token";
import { requestFailedWithError } from "@middleware/request-error";
import { requestPassedWithSuccess } from "@middleware/request-success";
import cors, { CorsOptions } from "cors";
import { envNames } from "@startup/config";

/**
 * Retrieves the options for the cross origin resource sharing.
 */
export const corsOptions = (): CorsOptions => ({
  origin: (origin, callback) => {
    // If the request's origin is an acceptable origin
    if (
      (origin && origin.match(<string>process.env[envNames.origins.local])) ||
      (origin && origin.match(<string>process.env[envNames.origins.lan])) ||
      (origin && origin.match(<string>process.env[envNames.origins.wan])) ||
      // Allows access from POSTMAN only in development mode
      (process.env[envNames.nodeEnv] === "development" && origin === undefined)
    ) {
      return callback(null, true);
    }
    // If the request's origin is not acceptable
    else {
      return callback(
        new Error(
          `This site ${origin} does not have an access. Only specific domains are allowed to access it.`
        ),
        false
      );
    }
  },
  optionsSuccessStatus: 200,
  exposedHeaders: [
    <string>process["env"]["JWT_ACC_REQ_HEADER"],
    <string>process["env"]["JWT_REF_REQ_HEADER"],
  ],
});

/**
 * Adds all the starting middleware to the Express server
 * @param server The Express server to add all the middleware to
 */
export const addStartMiddleware = (server: Express): void => {
  // Allows cross-origin requests
  server.use(cors(corsOptions()));

  // Parses JSON data from the request
  server.use(json());

  // Secures the Express server more by setting various HTTP headers
  server.use(helmet());

  // Parses URL encoded data from the request
  server.use(urlencoded({ extended: true }));

  // Retrieves the token from the request if available and sets it in "request.token"
  server.use(bearerToken());
};

/**
 * Adds all ending middleware to the Express server.
 *   ** WARNING **  Make sure to add the failed request middleware as the
 *                  last one since it terminates all requests whether failed
 *                  or not.
 *
 * @param server The Express server to add all the middleware to
 */
export const addEndMiddleware = (server: Express): void => {
  // Parses the request for any successful data and sends it as the response
  server.use(requestPassedWithSuccess);
  // Parses the request for any errors and sends the error as the response
  server.use(requestFailedWithError);
};
