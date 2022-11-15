import { ClientSession, HydratedDocument, Model } from "mongoose";

export type IRefreshTokenFamily = {
  token: string;
  expDate: Date;
  userId: string;
  familyId: string;
};

export type IRefreshTokenFamilyMethods = {
  /**
   * Deletes the refresh token family token and all refresh tokens
   * associated with it.
   * @param session — The DB session to use
   */
  deleteFamily(session?: ClientSession): Promise<boolean>;
};

export interface RefreshTokenFamilyModel
  extends Model<IRefreshTokenFamily, {}, IRefreshTokenFamilyMethods> {
  /**
   * Attempts to create a new refresh token family for a user.
   * @param userId — The ID of the user to create a new refresh token family for
   * @param session — The DB session to use
   */
  createTokenFamily(
    userId: string,
    session?: ClientSession
  ): Promise<DBLoadedRefreshTokenFamily | null>;
}

export type DBLoadedRefreshTokenFamily = HydratedDocument<
  IRefreshTokenFamily,
  IRefreshTokenFamilyMethods
>;
