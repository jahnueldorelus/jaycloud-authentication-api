import { Request as ExpressRequest } from "express";
import Joi from "joi";
import { genSalt, hash } from "bcrypt";
import { dbAuth } from "@services/database";
import {
  NewUser,
  newUserAttributes,
  ValidNewUserAccount,
} from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { connection } from "mongoose";
import { envNames } from "@startup/config";
import { ISSO } from "@app-types/database/models/sso";
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
const validateAccount = (newAccount: NewUser): ValidNewUserAccount => {
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
};

/**
 * Creates a new user
 * @param req The network request
 */
export const createNewUser = async (req: ExpressRequest): Promise<void> => {
  // The user's new account info from the request
  const newAccountInfo: NewUser = req.body;

  // Determines if the user's information is valid
  const { isValid, errorMessage, validatedValue } =
    validateAccount(newAccountInfo);

  // If the user's account information is valid
  if (isValid) {
    const dbSession = await connection.startSession();

    try {
      // Generates a salt for hashing
      const salt = await genSalt();
      // Hashes the user's password
      validatedValue.password = await hash(validatedValue.password, salt);

      dbSession.startTransaction();

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
    } finally {
      await dbSession.endSession();
    }
  }
  // If the user's account information is invalid
  else {
    RequestError(req, Error(errorMessage)).validation();
  }
};
