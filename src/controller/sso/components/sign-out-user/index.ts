import { ExpressRequestAndUser } from "@app-types/authorization";
import { CookieRemoval } from "@app-types/request-success";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { dbAuth } from "@services/database";
import { envNames } from "@startup/config";
import { connection } from "mongoose";
import Joi from "joi";
import {
  RefreshToken,
  ValidRefreshToken,
} from "@app-types/token/refresh-token";

// Schema validation
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().guid().required(),
});

/**
 * Deterimines if the user's refresh token is valid.
 * @param refreshToken The user's refresh token to validate
 */
const validateRefreshToken = (
  refreshToken: RefreshToken
): ValidRefreshToken => {
  const { error, value } = refreshTokenSchema.validate(refreshToken);

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

export const signOutUser = async (req: ExpressRequestAndUser) => {
  const requestData: RefreshToken = req.body;

  const { isValid, errorMessage, validatedValue } =
    validateRefreshToken(requestData);

  // If the request's service information is valid
  if (isValid) {
    const dbSession = await connection.startSession();

    try {
      dbSession.startTransaction();

      const refreshToken = await dbAuth.refreshTokensModel.findOne(
        {
          token: validatedValue.refreshToken,
        },
        null,
        { session: dbSession }
      );

      /**
       * Deletes all refresh tokens that are a part of the given refresh token's family
       * and the refresh family token itself
       */
      if (refreshToken) {
        const refreshTokenFamily =
          await dbAuth.refreshTokenFamiliesModel.findById(
            refreshToken.familyId
          );

        if (refreshTokenFamily) {
          await refreshTokenFamily.deleteFamily(dbSession);
        }
      }

      const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];
      const ssoToken = req.signedCookies[ssoTokenCookieKey];

      const deleteSSOResult = await dbAuth.ssoModel.deleteOne(
        { ssoId: ssoToken },
        {
          session: dbSession,
        }
      );

      if (!deleteSSOResult.acknowledged) {
        throw Error();
      }

      await dbSession.commitTransaction();

      const ssoCookieDeleteInfo: CookieRemoval = {
        key: ssoTokenCookieKey,
      };

      RequestSuccess(req, true, null, null, null, [ssoCookieDeleteInfo]);
    } catch (error: any) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      // Default error
      RequestError(
        req,
        Error("An error occurred logging out the user.")
      ).server();
    }
  }
  // If the given request info is invalid
  else {
    RequestError(req, Error(errorMessage)).notAuthorized();
  }
};
