import { Response as ExpressResponse, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import {
  CookieInfo,
  CookieRemoval,
  ExpressRequestSuccess,
  ExtraHeaders,
  RequestSuccessData,
  RequestSuccessFile,
} from "@app-types/request-success";
import { envNames } from "@startup/config";

/**
 * Handles all successful requests.
 * @param req The network request
 * @param res The network response
 * @param next The function that passes data to the next middleware
 */
export const requestPassedWithSuccess = (
  req: ExpressRequestSuccess,
  res: ExpressResponse,
  next: NextFunction
) => {
  // If there's a request error - send the error with the request's response
  if (req.success) {
    if (req.success.headers) {
      req.success.headers.forEach((header) => {
        res.setHeader(header.headerName, header.headerValue);
      });
    }

    res.status(StatusCodes.OK);

    const requestOriginDomain = <string>process.env[envNames.origins.domain];

    // Adds cookies
    if (req.success.cookies) {
      for (let cookie of req.success.cookies) {
        res.cookie(cookie.key, cookie.value, {
          domain: requestOriginDomain,
          expires: cookie.expDate,
          httpOnly: true,
          secure: true,
          signed: true,
          sameSite: cookie.sameSite,
        });
      }
    }

    // Removes cookies
    if (req.success.removeCookies) {
      for (let cookie of req.success.removeCookies) {
        res.clearCookie(cookie.key, { domain: requestOriginDomain });
      }
    }

    req.success.file
      ? res.sendFile(req.success.file)
      : res.send(req.success.data);
  } else {
    // Goes to the next middleware
    next();
  }
};

/**
 * Creates a successful network request
 * @param req The network request
 * @param data The data to send in the response
 * @param headers Headers to set in the response
 * @param file The file to send in the response
 * @param cookies The list of cookies to send in the response
 * @param removeCookies The list of cookies to remove
 */
export const RequestSuccess = (
  req: ExpressRequestSuccess,
  data: RequestSuccessData,
  headers?: ExtraHeaders | null,
  file?: RequestSuccessFile | null,
  cookies?: CookieInfo[] | null,
  removeCookies?: CookieRemoval[] | null
): void => {
  // Adds the object data to the request
  req.success = { data, headers, file, cookies, removeCookies };
};
