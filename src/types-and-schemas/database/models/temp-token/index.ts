import { ClientSession, HydratedDocument, Model } from "mongoose";

export type ITempToken = {
  token: string;
  userId: string;
  expDate: Date;
};

export type ITempTokenMethods = {};

export interface TempTokenModel
  extends Model<ITempToken, {}, ITempTokenMethods> {
  /**
   * Deletes all temporary tokens that have expired.
   * @param session — The DB session to use
   */
  deleteExpiredTokens(session?: ClientSession): Promise<boolean>;

  /**
   * Creates a new temporary token.
   * @param userId — The ID of the user to create a new refresh token family for
   * @param session — The DB session to use
   */
  createTempToken(
    userId: string,
    session?: ClientSession
  ): Promise<DBLoadedTempToken | null>;
}

export type DBLoadedTempToken = HydratedDocument<ITempToken, ITempTokenMethods>;
