import { Request as ExpressRequest } from "express";
import { db } from "@services/database";
import { UserCredentials } from "@app-types/user/authenticate-user";
import { RequestSuccess } from "@middleware/request-success";
import { databaseQuery } from "@services/database/queries";
import { RequestError } from "@middleware/request-error";
import { reqErrorMessages } from "@services/request-error-messages";
import { envNames } from "@startup/config";
import { CookieInfo } from "@app-types/request-success";

/**
 * Authenticates a user.
 * @param req The network request
 */
export const authenticateUser = async (req: ExpressRequest): Promise<void> => {
  const credentials: UserCredentials = req.body;
  const authenticatedInfo = await db.user.authenticateUser(
    credentials.email,
    credentials.password
  );

  if (databaseQuery.isFailedQueryResult(authenticatedInfo)) {
    if (
      authenticatedInfo.message === "invalid-user" ||
      authenticatedInfo.message === "bad-request"
    ) {
      RequestError(req, new Error(reqErrorMessages.authFailed)).badRequest();
    } else {
      RequestError(req, new Error("Failed to authenticate the user.")).server();
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
};
