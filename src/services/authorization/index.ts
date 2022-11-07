import { Request as ExpressRequest } from "express";
import { verify, Algorithm } from "jsonwebtoken";
import Joi from "joi";
import { newUserAttributes } from "@app-types/user/new-user";
import { TokenData } from "@app-types/token";

const userDataSchema = Joi.object({
  id: Joi.number().min(1).required(),
  firstName: newUserAttributes.firstName.joiSchema,
  lastName: newUserAttributes.lastName.joiSchema,
  email: newUserAttributes.email.joiSchema,
  iat: Joi.date().required(),
  exp: Joi.date().required(),
});

/**
 * Retrieves the data of the user from a request.
 * @param req The network request
 */
export const getUserData = (req: ExpressRequest): TokenData | null => {
  /**
   * Checks the request token and user property values exist and the
   * user's data is valid.
   */

  if (req.token) {
    // JWT private key
    const jwtPrivateKey: string = <string>process.env["JWT_KEY"];

    // JWT algorithm
    const jwtAlgorithm: Algorithm = <Algorithm>process.env["JWT_ALGORITHM"];

    // Decodes the token to retrieve the request user's info
    const userInfo: TokenData = <TokenData>verify(req.token, jwtPrivateKey, {
      algorithms: [jwtAlgorithm],
    });

    return userDataSchema.validate(userInfo).error ? null : userInfo;
  }

  return null;
};
