import { Request as ExpressRequest } from "express";
import { db } from "@services/database";
import { UserCredentials } from "@app-types/user/authenticate-user";
import { RequestSuccess } from "@middleware/request-success";
import { databaseQuery } from "@services/database/queries";
import { RequestError } from "@middleware/request-error";
import { reqErrorMessages } from "@services/request-error-messages";
import { envNames } from "@startup/config";
import { CookieInfo } from "@app-types/request-success";
import Joi from "joi";
import { ValidUserCredentials } from "./types";

// Schema validation
const initialAuthReqSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * Deterimines if the request's body's information is valid.
 * @param userCredentials The request's service information
 */
function validateUserCredentials(
  userCredentials: UserCredentials
): ValidUserCredentials {
  const { error, value } = initialAuthReqSchema.validate(userCredentials, {
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
}

/**
 * Authenticates a user.
 * @param req The network request
 */
export async function authenticateUser(req: ExpressRequest): Promise<void> {
  const credentials: UserCredentials = req.body;

  const { errorMessage, isValid, validatedValue } =
    validateUserCredentials(credentials);

  if (isValid) {
    const authenticatedInfo = await db.user.authenticateUser(
      validatedValue.email,
      validatedValue.password
    );

    if (databaseQuery.isFailedQueryResult(authenticatedInfo)) {
      if (
        authenticatedInfo.message === "invalid-user" ||
        authenticatedInfo.message === "invalid-password"
      ) {
        RequestError(req, new Error(reqErrorMessages.authFailed)).badRequest();
      } else {
        RequestError(
          req,
          new Error("Failed to authenticate the user.")
        ).server();
      }
    } else {
      const ssoCookie: CookieInfo = {
        expDate: authenticatedInfo.ssoToken.expDate,
        key: <string>process.env[envNames.cookie.ssoId],
        value: authenticatedInfo.ssoToken.ssoKey,
        sameSite: "lax",
      };

      RequestSuccess(
        req,
        authenticatedInfo.userPublicInfo,
        [
          // The access token
          {
            headerName: <string>process.env[envNames.jwt.accessReqHeader],
            headerValue: authenticatedInfo.accessToken,
          },
          // The refresh token
          {
            headerName: <string>process.env[envNames.jwt.refreshReqHeader],
            headerValue: authenticatedInfo.refreshToken.token,
          },
        ],
        null,
        [ssoCookie]
      );
    }
  } else {
    RequestError(req, new Error(errorMessage)).validation();
  }
}
