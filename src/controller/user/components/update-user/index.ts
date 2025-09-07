import Joi from "joi";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { envNames } from "@startup/config";
import {
  getRequestUserData,
  requestIsAuthorized,
} from "@middleware/authorization";
import { ExpressRequestAndUser } from "@app-types/authorization";
import {
  UserUpdateData,
  ValidUserUpdateInfo,
} from "@app-types/user/update-user";
import { db } from "@services/database";
import { genSalt, hash } from "bcrypt";
import { databaseQuery } from "@services/database/queries";
import { CookieInfo } from "@app-types/request-success";

// Schema validation
const updatetAccountSchema = Joi.object({
  firstName: newUserAttributes.firstName.joiSchema.optional(),
  lastName: newUserAttributes.lastName.joiSchema.optional(),
  password: newUserAttributes.password.joiSchema.optional(),
});

/**
 * Deterimines if the user's account information is valid.
 * @param newUserInfo The user's information to validate
 */
function validateInfo(newUserInfo: UserUpdateData): ValidUserUpdateInfo {
  const { error, value } = updatetAccountSchema.validate(newUserInfo);

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
 * Updates a new user.
 * @param req The network request
 */
export async function updateUser(req: ExpressRequestAndUser): Promise<void> {
  const reqUser = getRequestUserData(req);

  if (requestIsAuthorized(req) && reqUser) {
    // The user's updated account info from the request
    const newUserInfo: UserUpdateData = req.body;

    // Determines if the user's updated information is valid
    const { isValid, errorMessage, validatedValue } = validateInfo(newUserInfo);

    if (isValid) {
      try {
        if (validatedValue.password) {
          // Generates a salt for hashing
          const salt = await genSalt();
          // Hashes the user's password
          validatedValue.password = await hash(validatedValue.password, salt);
        }

        const updatedUser = await db.user.updateUser(
          reqUser.email,
          validatedValue
        );

        if (databaseQuery.isFailedQueryResult(updatedUser)) {
          throw Error(updatedUser.message);
        }

        const ssoKey: string | undefined = process.env[envNames.cookie.key];
        const ssoCookieInfo: CookieInfo = {
          key: ssoKey || "",
          sameSite: "lax",
          value: updatedUser.ssoToken.ssoKey || "",
          expDate: updatedUser.ssoToken.expDate,
        };
        const listOfCookies: CookieInfo[] = ssoCookieInfo
          ? [ssoCookieInfo]
          : [];

        RequestSuccess(
          req,
          updatedUser.userPublicInfo,
          [
            // The access token
            {
              headerName: <string>process.env[envNames.jwt.accessReqHeader],
              headerValue: updatedUser.accessToken,
            },
            // The refresh token
            {
              headerName: <string>process.env[envNames.jwt.refreshReqHeader],
              headerValue: updatedUser.refreshToken.token,
            },
          ],
          null,
          listOfCookies
        );
      } catch (error: any) {
        RequestError(req, Error("Failed to update the account.")).server();
      }
    }
    // If there's a validation error
    else {
      RequestError(req, Error(errorMessage)).validation();
    }
  }
}
