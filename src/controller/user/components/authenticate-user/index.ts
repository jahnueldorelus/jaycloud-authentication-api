import { Request as ExpressRequest } from "express";
import { dbAuth } from "@services/database";
import { UserCredentials } from "@app-types/user/authenticate-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { connection } from "mongoose";
import { reqErrorMessages } from "@services/request-error-messages";
import { envNames } from "@startup/config";
import { ISSO } from "@app-types/database/models/sso";
import { CookieInfo } from "@app-types/request-success";

/**
 * Authenticates a user
 * @param req The network request
 */
export const authenticateUser = async (req: ExpressRequest): Promise<void> => {
  const credentials: UserCredentials = req.body;

  const dbSession = await connection.startSession();

  try {
    dbSession.startTransaction();
    const user = await dbAuth.usersModel.authenticateUser(
      credentials.email,
      credentials.password,
      dbSession
    );

    if (!user) {
      throw Error(reqErrorMessages.authFailed);
    }

    const accessToken = user.generateAccessToken();

    const refreshTokenFamily =
      await dbAuth.refreshTokenFamiliesModel.createTokenFamily(
        user.id,
        dbSession
      );

    if (!refreshTokenFamily) {
      throw Error();
    }

    const refreshToken = await dbAuth.refreshTokensModel.createToken(
      user.id,
      refreshTokenFamily.id,
      dbSession
    );

    if (!accessToken || !refreshToken) {
      throw Error();
    }

    // Creates a new SSO record to provide SSO functionality across all services
    const encryptedSSOToken = dbAuth.ssoModel.createEncryptedToken(user);

    if (!encryptedSSOToken) {
      throw Error();
    }

    const ssoInfo: ISSO = {
      expDate: refreshToken.expDate,
      ssoId: encryptedSSOToken,
      userId: user.id,
    };

    const [ssoDoc] = await dbAuth.ssoModel.create([ssoInfo], {
      session: dbSession,
    });

    if (!ssoDoc) {
      throw Error();
    }

    const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];
    const ssoTokenCookieInfo: CookieInfo = {
      expDate: ssoDoc.expDate,
      key: ssoTokenCookieKey,
      value: ssoDoc.ssoId,
      sameSite: "lax",
    };

    await dbSession.commitTransaction();

    RequestSuccess(
      req,
      user.toPrivateJSON(),
      [
        // The access token
        {
          headerName: <string>process.env[envNames.jwt.accessReqHeader],
          headerValue: accessToken,
        },
        // The refresh token
        {
          headerName: <string>process.env[envNames.jwt.refreshReqHeader],
          headerValue: refreshToken.token,
        },
      ],
      null,
      [ssoTokenCookieInfo]
    );
  } catch (error: any) {
    if (dbSession.inTransaction()) {
      await dbSession.abortTransaction();
    }

    // Authentication failed error
    if (error.message === reqErrorMessages.authFailed) {
      RequestError(req, error).badRequest();
    } else {
      // Default error
      RequestError(req, Error("Failed to authenticate user.")).server();
    }
  } finally {
    await dbSession.endSession();
  }
};
