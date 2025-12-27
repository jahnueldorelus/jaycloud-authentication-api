import { Request as ExpressRequest } from "express";
import Joi from "joi";
import { genSalt, hash } from "bcrypt";
import { db } from "@services/database";
import {
  NewUser,
  newUserAttributes,
  ValidNewUserAccount,
} from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { envNames } from "@startup/config";
import { databaseQuery } from "@services/database/queries";
import { CookieInfo } from "@app-types/request-success";

// Schema validation
const newAccountSchema = Joi.object({
  firstName: newUserAttributes.firstName.joiSchema,
  lastName: newUserAttributes.lastName.joiSchema,
  email: newUserAttributes.email.joiSchema,
  password: newUserAttributes.password.joiSchema,
});

/**
 * Deterimines if the user's new account information is valid.
 * @param newAccount The user's information to validate
 */
function validateAccount(newAccount: NewUser): ValidNewUserAccount {
  const { error, value } = newAccountSchema.validate(newAccount);

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
 * Attempts to create a new user.
 * @param req The network request
 */
export async function createNewUser(req: ExpressRequest): Promise<void> {
  const newAccountInfo: NewUser = req.body;

  const { isValid, errorMessage, validatedValue } =
    validateAccount(newAccountInfo);

  if (isValid) {
    try {
      const salt = await genSalt();
      validatedValue.password = await hash(validatedValue.password, salt);
      const createdUser = await db.user.createUser(validatedValue);

      if (databaseQuery.isFailedQueryResult(createdUser)) {
        const queryError = createdUser;

        // Handles duplicate user error
        if (queryError.message === "duplicate-user") {
          RequestError(
            req,
            Error(
              `Failed to create a new account for "${validatedValue.email}". This email is already registered.`
            )
          ).badRequest();
        } else {
          throw Error();
        }
      } else {
        const ssoKey: string | undefined = process.env[envNames.cookie.key];
        const ssoCookieInfo: CookieInfo = {
          key: ssoKey || "",
          sameSite: "lax",
          value: createdUser.ssoToken.ssoKey || "",
          expDate: createdUser.ssoToken.expDate,
        };
        const listOfCookies: CookieInfo[] = ssoCookieInfo
          ? [ssoCookieInfo]
          : [];

        RequestSuccess(
          req,
          createdUser.userPublicInfo,
          [
            // The access token
            {
              headerName: <string>process.env[envNames.jwt.accessReqHeader],
              headerValue: createdUser.accessToken,
            },
            // The refresh token
            {
              headerName: <string>process.env[envNames.jwt.refreshReqHeader],
              headerValue: createdUser.refreshToken.token,
            },
          ],
          null,
          listOfCookies
        );
      }
    } catch (error) {
      // Default error
      RequestError(req, Error("Failed to create a new account.")).server();
    }
  }
  // If the user's account information is invalid
  else {
    RequestError(req, Error(errorMessage)).validation();
  }
}
