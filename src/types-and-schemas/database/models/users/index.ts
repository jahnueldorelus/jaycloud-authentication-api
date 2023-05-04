import { PrivateSSOUserData, PrivateUserData } from "@app-types/user";
import { ClientSession, HydratedDocument, Model } from "mongoose";

export type IUser = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isAdmin: boolean;
};

export type IUserMethods = {
  /**
   * Generates an access token of the user.
   */
  generateAccessToken(): string;
  /**
   * Generates a JSON that excludes a user's private information.
   */
  toPrivateJSON(): PrivateUserData;
  /**
   * Generates a JSON that excludes a user's private information for sso.
   */
  toPrivateSSOJSON(): PrivateSSOUserData;
  /**
   * Retrieves the user's full name.
   */
  getFullName(): string;
};

export interface UsersModel extends Model<IUser, {}, IUserMethods> {
  /**
   * Attempts to authenticate a user using their credentials.
   * If successful, an access token is returned, otherwise null.
   * @param email The user's email
   * @param password The user's password
   * @param session — The DB session to use
   */
  authenticateUser(
    email: string,
    password: string,
    session?: ClientSession
  ): Promise<DBLoadedUser | null>;
}

export type DBLoadedUser = HydratedDocument<IUser, IUserMethods>;
