import { ClientSession, HydratedDocument, Model } from "mongoose";
import { DBLoadedUser } from "../users";

export type IRefreshToken = {
  token: string;
  expDate: Date;
  userId: string;
  familyId: string;
};

export type IRefreshTokenMethods = {
  /**
   * Determines if a refresh token has expired.
   */
  isExpired(): boolean;
  /**
   * Changes the expiration date of the token
   * to set it as expired.
   * @param session — The DB session to use
   */
  expireToken(session?: ClientSession): Promise<void>;
  /**
   * Gets the user associated with the refresh token.
   * @param session — The DB session to use
   */
  getUser(session?: ClientSession): Promise<DBLoadedUser | null>;
};

export interface RefreshTokenModel
  extends Model<IRefreshToken, {}, IRefreshTokenMethods> {
  /**
   * Attempts to create a new token for a user.
   * @param userId — The ID of the user to create a new refresh token for
   * @param familyId — The ID of the refresh token family the new token will belong to
   * @param session — The DB session to use
   */
  createToken(
    userId: string,
    familyId: string,
    session?: ClientSession
  ): Promise<DBLoadedRefreshToken | null>;
}

export type DBLoadedRefreshToken = HydratedDocument<
  IRefreshToken,
  IRefreshTokenMethods
>;
