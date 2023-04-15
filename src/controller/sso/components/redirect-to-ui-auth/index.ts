import { RequestSuccess } from "@middleware/request-success";
import { envNames } from "@startup/config";
import { Request as ExpressRequest } from "express";
import { randomUUID } from "crypto";
import { connection } from "mongoose";
import { dbAuth } from "@services/database";
import { ISSO } from "@app-types/database/models/sso";
import moment from "moment";
import { RequestError } from "@middleware/request-error";
import Joi from "joi";
import {
  RedirectToAuthUIResponse,
  ServiceInfo,
  ValidServiceUrl,
} from "@app-types/sso";
import { CookieInfo } from "@app-types/request-success";
import { genSalt, hash } from "bcrypt";

// Schema validation
const initialAuthReqSchema = Joi.object({
  serviceUrl: Joi.string().uri().required(),
});

/**
 * Deterimines if the request's service's information is valid.
 * @param serviceInfo The request's service information
 */
const validateServiceInfo = (serviceInfo: ServiceInfo): ValidServiceUrl => {
  const { error, value } = initialAuthReqSchema.validate(serviceInfo, {
    allowUnknown: false,
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

export const redirectToUiAuth = async (req: ExpressRequest) => {
  const requestData: ServiceInfo = req.body;

  const { isValid, errorMessage, validatedValue } =
    validateServiceInfo(requestData);

  // If the request's service information is valid
  if (isValid) {
    const dbSession = await connection.startSession();

    const authUrl =
      process.env[envNames.nodeEnv] === "production"
        ? process.env[envNames.origins.wanProd]
        : process.env[envNames.origins.wanDev];

    try {
      dbSession.startTransaction();

      // Initial auth request service url cookie key
      const serviceUrlCookieKey = <string>(
        process.env[envNames.cookie.serviceUrl]
      );
      // Initial auth request cookie key
      const authReqCookieKey = <string>(
        process.env[envNames.cookie.initialAuthReq]
      );
      // Initial auth request id from cookie
      const initAuthReqId = req.signedCookies[authReqCookieKey];

      // Removes the old initial auth request if it exists
      if (initAuthReqId) {
        await dbAuth.ssoModel.findOneAndRemove(
          { reqId: initAuthReqId },
          { session: dbSession }
        );
      }

      // Creates a new initial auth request
      const expAuthReqDate = moment(new Date());
      expAuthReqDate.add(
        parseInt(<string>process.env[envNames.jwt.refreshExpDays]),
        "days"
      );

      // Generates a salt for hashing
      const salt = await genSalt();
      const newReqId = randomUUID();
      const hashedReqId = await hash(newReqId, salt);

      const ssoInfo: ISSO = {
        expDate: expAuthReqDate.toDate(),
        reqId: hashedReqId,
        ssoId: null,
        userId: null,
      };

      const [ssoReq] = await dbAuth.ssoModel.create([ssoInfo], {
        session: dbSession,
      });

      if (!ssoReq) {
        throw Error();
      }

      await dbSession.commitTransaction();

      const authReqCookieInfo: CookieInfo = {
        expDate: ssoReq.expDate,
        key: authReqCookieKey,
        value: hashedReqId,
        sameSite: "lax",
      };

      const serviceUrlCookieInfo: CookieInfo = {
        key: serviceUrlCookieKey,
        value: validatedValue.serviceUrl,
        sameSite: "strict",
      };

      RequestSuccess(
        req,
        <RedirectToAuthUIResponse>{
          authUrl: authUrl + "/login?sso=true",
        },
        null,
        null,
        [authReqCookieInfo, serviceUrlCookieInfo]
      );
    } catch (error: any) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      RequestError(req, Error("Failed to initialize auth request.")).server();
    } finally {
      await dbSession.endSession();
    }
  }
  // If the given service info from the request is invalid
  else {
    RequestError(req, Error(errorMessage)).validation();
  }
};
