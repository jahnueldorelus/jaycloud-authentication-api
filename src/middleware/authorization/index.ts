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
import { ExpressRequestAndUser } from "@app-types/authorization";
import { RequestError } from "@middleware/request-error";
import { reqErrorMessages } from "@services/request-error-messages";
import { dbAuth } from "@services/database";

const userDataSchema = Joi.object({
  id: Joi.string().min(24).max(24).required(),
  firstName: newUserAttributes.firstName.joiSchema,
  lastName: newUserAttributes.lastName.joiSchema,
  email: newUserAttributes.email.joiSchema,
  iat: Joi.date().required(),
  exp: Joi.date().required(),
});

/**
 * Determines if the request is authorized.
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

  // The user's token
  const token: string | undefined = userReq.token;

  // Adds the user's info from the request
  if (token) {
    const jwtPrivateKey: string = <string>process.env[envNames.jwt.key];
    const jwtAlgorithm: Algorithm = <Algorithm>process.env[envNames.jwt.alg];

    // Attempts to decode the token
    try {
      const userInfo: TokenData = <TokenData>verify(token, jwtPrivateKey, {
        algorithms: [jwtAlgorithm],
      });

      // If the user's token's validation failed
      if (userDataSchema.validate(userInfo).error) {
        throw Error();
      }

      // If the user from the token doesn't exist
      const userExists = await dbAuth.usersModel.findById(userInfo.id);
      if (!userExists) {
        throw Error(reqErrorMessages.nonExistentUser);
      }

      // Saves the user's info to the request
      userReq.user = userInfo as TokenData;
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
  }

  // If the token is unavailable
  else {
    RequestError(userReq, Error(reqErrorMessages.noToken)).notAuthorized();
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
): TokenData | null => {
  return req.user || null;
};
