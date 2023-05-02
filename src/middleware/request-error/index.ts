import { reqErrorMessages } from "@services/request-error-messages";
import { Response as ExpressResponse } from "express";
import { StatusCodes } from "http-status-codes";
import {
  ExpressRequestError,
  RequestErrorMethods,
} from "@app-types/request-error";
import { CookieRemoval } from "@app-types/request-success";
import { envNames } from "@startup/config";

/**
 * Handles all errors from a request. This is the last middleware
 * the Express server will go through.
 * @param req The network request
 * @param res The network response
 */
export const requestFailedWithError = (
  req: ExpressRequestError,
  res: ExpressResponse
) => {
  // If there's a request error - send the error with the request's response
  if (req.failed) {
    // Removes cookies
    if (req.cookiesToRemove) {
      const requestOriginDomain = <string>process.env[envNames.origins.domain];

      for (let cookie of req.cookiesToRemove) {
        res.clearCookie(cookie.key, { domain: requestOriginDomain });
      }
    }
    res.status(req.failed.status).send(req.failed.errorMessage);
  } else {
    /**
     * If there's no request error - an error occured with the server since
     * no response was returned. Therefore, an internal server error is returned
     */
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(reqErrorMessages.serverError);
  }
};

/**
 * Creates a network request error
 * @param req A network request
 * @param error The error that occured with the request
 * @param cookiesToRemove The list of cookies to remove
 * @returns The methods available to be called to specify the request error
 */
export const RequestError = (
  req: ExpressRequestError,
  error: Error,
  cookiesToRemove?: CookieRemoval[]
): RequestErrorMethods => {
  req.cookiesToRemove = cookiesToRemove;

  /**
   * Creates a request error
   * @param defaultMessage The default error message
   * @param status The request's error status
   * @param errorMessage A custom error message
   */
  const createError = (
    defaultMessage: string,
    status: StatusCodes,
    errorMessage?: string
  ) => {
    return {
      errorMessage: errorMessage || defaultMessage,
      status,
    };
  };

  /**
   * Sets the network error as a bad request
   */
  const badRequest = (): void => {
    // Adds the error to the request
    req.failed = createError(
      reqErrorMessages.badRequest,
      StatusCodes.BAD_REQUEST,
      error.message
    );
  };

  /**
   * Sets the network error as an unauthorized request
   */
  const notAuthorized = (): void => {
    // Adds the error to the request
    req.failed = createError(
      reqErrorMessages.forbiddenUser,
      StatusCodes.UNAUTHORIZED,
      error.message
    );
  };

  /**
   * Sets the network error as a forbidden request
   */
  const forbidden = (): void => {
    // Adds the error to the request
    req.failed = createError(
      reqErrorMessages.forbiddenUser,
      StatusCodes.FORBIDDEN,
      error.message
    );
  };

  /**
   * Sets the network error as a bad request due to validation errors
   */
  const validation = (): void => {
    // Adds the error to the request
    req.failed = createError(
      reqErrorMessages.validationFail,
      StatusCodes.BAD_REQUEST,
      error.message
        ? `${reqErrorMessages.validationFail} Property ${error.message}`
        : undefined
    );
  };

  /**
   * Sets the network error as an internal server error
   */
  const server = (): void => {
    // Adds the error to the request
    req.failed = createError(
      reqErrorMessages.serverError,
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message
    );
  };

  // Returns the methods available to call
  return { badRequest, notAuthorized, forbidden, validation, server };
};
