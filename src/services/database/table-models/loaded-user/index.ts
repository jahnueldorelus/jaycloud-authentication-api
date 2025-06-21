import { DatabaseUserData } from "@services/database/tables/user/types";
import { sign as jwtSign, SignOptions } from "jsonwebtoken";
import { UserPublicData, TokenData, UserSsoData } from "./types";
import { envNames } from "@startup/config";

export class LoadedUser {
  public readonly id: number;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly email: string;
  public readonly password: string;
  public readonly isAdmin: boolean;

  constructor(userData: DatabaseUserData) {
    this.id = userData.id;
    this.email = userData.email;
    this.firstName = userData.first_name;
    this.lastName = userData.last_name;
    this.password = userData.user_password;
    this.isAdmin = Boolean(userData.is_admin);
  }

  /**
   * Generates an access token based on the user's info.
   * @returns A JWT token
   */
  public generateAccessToken(): string {
    // The user's data to attach to their web token
    const userData: TokenData = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
    };

    // Returns the user's web token
    return jwtSign(
      userData,
      <string>process.env[envNames.jwt.privateKey],
      <SignOptions>{
        algorithm: <string>process.env[envNames.jwt.alg],
        expiresIn: <string>process.env[envNames.jwt.accessExpiration],
      }
    );
  }

  /**
   * Generates a new refresh token.
   * @returns A refresh token
   */
  public async generateRefreshToken(): Promise<any> {
    /**
     *
     * NEED TO WRITE FUNCTIONAL CODE HERE
     *
     */
  }

  /**
   * Generates an immutable JSON object without the user's private info.
   * @returns The user's public info in JSON format
   */
  public toPublicJson(): UserPublicData {
    return Object.freeze({
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      isAdmin: this.isAdmin,
    });
  }

  /**
   * Generates an immutable JSON object with the user's SSO info.
   * @returns The user's sso info in JSON format
   */
  public toSsoJson(): UserSsoData {
    return Object.freeze({
      firstName: this.firstName,
      lastName: this.lastName,
      isAdmin: this.isAdmin,
    });
  }

  /**
   * Retrieves the full name of the user.
   * @returns The user's full name in camel case form
   */
  public getFullName(): string {
    const firstName: string =
      this.firstName[0]?.toUpperCase() + this.firstName.slice(1);

    const lastName: string =
      this.lastName[0]?.toUpperCase() + this.lastName.slice(1);

    return `${firstName} ${lastName}`;
  }
}
