import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import { verify, Algorithm } from "jsonwebtoken";
import Joi from "joi";
import { newUserAttributes } from "@app-types/user/new-user";
import { TokenData } from "@app-types/token/access-token";
import { envNames } from "@startup/config";
import {
  ExpressRequestAndUser,
  SSOToken,
  ValidSSOToken,
} from "@app-types/authorization";
import { RequestError } from "@middleware/request-error";
import { reqErrorMessages } from "@services/request-error-messages";
import { dbAuth } from "@services/database";
import { connection } from "mongoose";
import { DBLoadedUser } from "@app-types/database/models/users";
import { compare } from "bcrypt";

const tokenDataSchema = Joi.object({
  firstName: newUserAttributes.firstName.joiSchema,
  lastName: newUserAttributes.lastName.joiSchema,
  email: newUserAttributes.email.joiSchema,
  iat: Joi.date().required(),
  exp: Joi.date().required(),
});

/**
 * Determines if the request is authorized through JWT.
 * @param req The network request
 * @param res The network response
 * @param next Next function to pass request and response to next middleware
 */
export const validateRequestAuthorization = async (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
) => {
  const userReq = <ExpressRequestAndUser>req;
  const token: string | undefined = userReq.token;

  // Adds the user's info from the request
  if (token) {
    const dbSession = await connection.startSession();
    const jwtPublicKey: string = <string>process.env[envNames.jwt.publicKey];
    const jwtAlgorithm: Algorithm = <Algorithm>process.env[envNames.jwt.alg];

    // Attempts to decode the token
    try {
      const tokenInfo: TokenData = <TokenData>verify(token, jwtPublicKey, {
        algorithms: [jwtAlgorithm],
      });

      // If the user's token's validation failed
      if (tokenDataSchema.validate(tokenInfo).error) {
        throw Error();
      }

      // If the user from the token doesn't exist
      dbSession.startTransaction();
      const dbUser = await dbAuth.usersModel.findOne({
        email: tokenInfo.email,
      });
      await dbSession.commitTransaction();

      if (!dbUser) {
        throw Error(reqErrorMessages.nonExistentUser);
      }

      // Saves the user's info to the request
      userReq.user = dbUser;
    } catch (error: any) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      // User doesn't exist
      if (error.message === reqErrorMessages.nonExistentUser) {
        RequestError(
          userReq,
          Error(reqErrorMessages.nonExistentUser)
        ).notAuthorized();
      }
      // Error decoding the token (default)
      else {
        RequestError(
          userReq,
          Error(reqErrorMessages.invalidToken)
        ).notAuthorized();
      }
    } finally {
      await dbSession.endSession();
    }
  } else {
    RequestError(userReq, Error(reqErrorMessages.invalidToken)).notAuthorized();
  }

  // Goes to the next Express middleware
  next();
};

// Schema validation
const ssoReqValidationSchema = Joi.object({
  token: Joi.string().min(36).max(36).required(),
});

/**
 * Deterimines if the request's sso token is valid.
 * @param ssoToken The request's sso token
 */
const validateSSOToken = (ssoToken: SSOToken): ValidSSOToken => {
  const { error, value } = ssoReqValidationSchema.validate(ssoToken, {
    allowUnknown: true,
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

/**
 * Determines if the request is authorized through SSO.
 * @param req The network request
 * @param res The network response
 * @param next Next function to pass request and response to next middleware
 */
export const validateSSOReqAuthorization = async (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
) => {
  const requestData: SSOToken = req.body;

  const { isValid, validatedValue } = validateSSOToken(requestData);

  // If the request's sso token is valid
  if (isValid) {
    const dbSession = await connection.startSession();
    
    try {
      dbSession.startTransaction();
      
      // SSO token cookie key
      const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];
      // SSO token key from cookie
      const ssoToken = req.signedCookies[ssoTokenCookieKey];

      if (!ssoToken) {
        throw Error(reqErrorMessages.invalidToken);
      }

      // Determines if the SSO token from the request matches the cookie
      const isTokenTheSame = await compare(validatedValue.token, ssoToken);

      if (!isTokenTheSame) {
        throw Error(reqErrorMessages.invalidToken);
      }

      const ssoDoc = await dbAuth.ssoModel.findOne({ ssoId: ssoToken }, null, {
        session: dbSession,
      });

      if (!ssoDoc) {
        throw Error(reqErrorMessages.invalidToken);
      }

      const userDoc = await dbAuth.usersModel.findById(ssoDoc.userId, null, {
        session: dbSession,
      });

      if (!userDoc) {
        throw Error(reqErrorMessages.nonExistentUser);
      }

      await dbSession.commitTransaction();

      (<ExpressRequestAndUser>req).user = userDoc;
      (<ExpressRequestAndUser>req).token = userDoc.generateAccessToken();
    } catch (error: any) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      // Non-existent user
      if (error.message === reqErrorMessages.nonExistentUser) {
        RequestError(
          req,
          Error(reqErrorMessages.forbiddenUser)
        ).notAuthorized();
      }
      // Invalid token error
      else if (error.message === reqErrorMessages.invalidToken) {
        RequestError(req, Error(reqErrorMessages.invalidToken)).notAuthorized();
      }
      // Default error
      else {
        RequestError(req, Error(reqErrorMessages.serverError)).server();
      }
    } finally {
      await dbSession.endSession();
    }
  }
  // If the sso token is invalid
  else {
    RequestError(req, Error(reqErrorMessages.invalidToken)).notAuthorized();
  }

  // Goes to the next Express middleware
  next();
};

/**
 * Retrieves the request's authorized user if available.
 * @param req The network request
 */
export const getRequestUserData = (
  req: ExpressRequestAndUser
): DBLoadedUser | null => {
  return req.user || null;
};

/**
 * Determines if a request is authorized.
 */
export const requestIsAuthorized = (req: ExpressRequestAndUser) => {
  return req.token && req.user ? true : false;
};

/**
 * Determines if a request can be processed after its been through
 * the authentication middleware. Only requests with no token or a valid
 * token can be processed. Requests with invalid tokens will not be processed.
 */
export const requestAuthenticationChecked = (req: ExpressRequestAndUser) => {
  return req.token && !req.user ? false : true;
};
