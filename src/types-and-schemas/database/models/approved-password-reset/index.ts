import moment from "moment";
import { ClientSession, HydratedDocument, Model } from "mongoose";

export type IApprovedPasswordReset = {
  userId: string;
  token: string;
  expDate: Date;
};

export type IApprovedPasswordResetMethods = {};

export interface ApprovedPasswordResetModel
  extends Model<IApprovedPasswordReset, {}, IApprovedPasswordResetMethods> {
  /**
   * Determines the amount of time before an approved password reset expires
   */
  getPasswordResetExpireTime(): moment.Moment;

  /**
   * Deletes all approved password resets that have expired.
   * @param session — The DB session to use
   */
  deleteExpiredApprovedPassResets(session?: ClientSession): Promise<boolean>;

  /**
   * Creates an approved password reset.
   * @param userId — The ID of the user to create a new refresh token family for
   * @param session — The DB session to use
   */
  createApprovedPasswordReset(
    userId: string,
    session?: ClientSession
  ): Promise<DBLoadedApprovedPasswordReset | null>;
}

export type DBLoadedApprovedPasswordReset = HydratedDocument<
  IApprovedPasswordReset,
  IApprovedPasswordResetMethods
>;
