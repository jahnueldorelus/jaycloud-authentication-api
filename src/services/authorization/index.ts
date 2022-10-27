import { Request as ExpressRequest } from "express";
import { UserData } from "@app-types/user";
import { verify, Algorithm } from "jsonwebtoken";

/**
 * Retrieves the data of the user from a request.
 * @param req The network request
 */
export const getUserData = (req: ExpressRequest): UserData | null => {
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
    const userInfo = verify(req.token, jwtPrivateKey, {
      algorithms: [jwtAlgorithm],
    });

    return userInfo;
  }

  return null;
};
