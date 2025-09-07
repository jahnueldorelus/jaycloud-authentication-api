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
import { db, dbAuth } from "@services/database";
import { LoadedUser } from "@services/database/table-models/loaded-user";

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
export async function validateRequestAuthorization(
  req: ExpressRequest,
  _res: ExpressResponse,
  next: NextFunction
) {
  const userReq = <ExpressRequestAndUser>req;
  const token: string | undefined = userReq.token;

  if (token) {
    const jwtPublicKey: string = <string>process.env[envNames.jwt.publicKey];
    const jwtAlgorithm: Algorithm = <Algorithm>process.env[envNames.jwt.alg];

    try {
      const tokenInfo: TokenData = <TokenData>verify(token, jwtPublicKey, {
        algorithms: [jwtAlgorithm],
      });

      if (tokenDataSchema.validate(tokenInfo).error) {
        throw Error();
      }

      const reqUserDbInfo = await db.user.getUserByEmail(tokenInfo.email);

      if (!reqUserDbInfo) {
        throw Error(reqErrorMessages.nonExistentUser);
      }

      userReq.user = reqUserDbInfo;
    } catch (error: any) {
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
    }
  } else {
    RequestError(userReq, Error(reqErrorMessages.invalidToken)).notAuthorized();
  }

  // Goes to the next Express middleware
  next();
}

// Schema validation
const ssoReqValidationSchema = Joi.object({
  token: Joi.string().min(36).max(36).required(),
});

/**
 * Deterimines if the request's sso token is valid.
 * @param ssoToken The request's sso token
 */
function validateSSOToken(ssoToken: SSOToken): ValidSSOToken {
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
}

/**
 * Determines if the request is authorized through SSO.
 * @param req The network request
 * @param res The network response
 * @param next Next function to pass request and response to next middleware
 */
export async function validateSSOReqAuthorization(
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
) {
  const requestData: SSOToken = req.body;

  const { isValid, validatedValue } = validateSSOToken(requestData);

  // If the request's sso token is valid
  if (isValid) {
    try {
      // SSO token cookie key
      const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];
      // SSO token key from cookie or header
      const ssoToken =
        req.signedCookies[ssoTokenCookieKey] || req.headers["sso-token"];

      if (!ssoToken) {
        throw Error(reqErrorMessages.invalidToken);
      }

      const ssoDoc = await dbAuth.ssoModel.findOne({ ssoId: ssoToken }, null);

      if (!ssoDoc) {
        throw Error(reqErrorMessages.invalidToken);
      }

      const isTokenTheSame =
        validatedValue.token === dbAuth.ssoModel.getDecryptedToken(ssoDoc);

      if (!isTokenTheSame) {
        throw Error(reqErrorMessages.invalidToken);
      }

      const userDoc = await dbAuth.usersModel.findById(ssoDoc.userId, null);

      if (!userDoc) {
        throw Error(reqErrorMessages.nonExistentUser);
      }

      // (<ExpressRequestAndUser>req).user = userDoc;
      (<ExpressRequestAndUser>req).token = userDoc.generateAccessToken();
    } catch (error: any) {
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
    }
  }
  // If the sso token is invalid
  else {
    RequestError(req, Error(reqErrorMessages.invalidToken)).notAuthorized();
  }

  // Goes to the next Express middleware
  next();
}

/**
 * Retrieves the request's authorized user if available.
 * @param req The network request
 */
export function getRequestUserData(
  req: ExpressRequestAndUser
): LoadedUser | null {
  return req.user;
}

/**
 * Determines if a request is authorized.
 */
export function requestIsAuthorized(req: ExpressRequestAndUser) {
  return req.token && req.user ? true : false;
}

/**
 * Determines if a request can be processed after its been through
 * the authentication middleware. Only requests with no token or a valid
 * token can be processed. Requests with invalid tokens will not be processed.
 */
export function requestAuthenticationChecked(req: ExpressRequestAndUser) {
  return req.token && !req.user ? false : true;
}
