import { Request as ExpressRequest } from "express";
import Joi from "joi";
import { genSalt, hash } from "bcrypt";
import { db, dbAuth } from "@services/database";
import {
  NewUser,
  newUserAttributes,
  ValidNewUserAccount,
} from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { envNames } from "@startup/config";

// Schema validation
const newAccountSchema = Joi.object({
  firstName: newUserAttributes.firstName.joiSchema,
  lastName: newUserAttributes.lastName.joiSchema,
  email: newUserAttributes.email.joiSchema,
  password: newUserAttributes.password.joiSchema,
  isAdmin: newUserAttributes.isAdmin,
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
      const createdUser = await db.user.createUser(newAccountInfo);

      const [user] = await dbAuth.usersModel.create([validatedValue], {
        session: dbSession,
      });
      if (!user) {
        throw Error();
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

      const ssoTokenCookieInfo = await dbAuth.ssoModel.createUserSSOToken(
        user,
        refreshToken.expDate,
        dbSession
      );

      if (!ssoTokenCookieInfo) {
        throw Error();
      }

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
      // If the error is a duplicate email
      if (error && error.code === 11000 && error.keyPattern.email === 1) {
        RequestError(
          req,
          Error(
            `Failed to create a new account for "${validatedValue.email}". This email is already registered.`
          )
        ).badRequest();
      } else {
        // Default error
        RequestError(req, Error("Failed to create a new account.")).server();
      }
    }
  }
  // If the user's account information is invalid
  else {
    RequestError(req, Error(errorMessage)).validation();
  }
}
