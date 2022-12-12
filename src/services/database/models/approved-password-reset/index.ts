import {
  DBLoadedApprovedPasswordReset,
  IApprovedPasswordReset,
  IApprovedPasswordResetMethods,
  ApprovedPasswordResetModel,
} from "@app-types/database/models/approved-password-reset";
import { envNames } from "@startup/config";
import { ClientSession, model, Schema } from "mongoose";
import { connection } from "mongoose";

/**
 * ANY CHANGES MADE TO THE SCHEMA MUST ALSO BE MADE IN MODEL'S TYPES
 */
const approvedPasswordResetSchema = new Schema<
  IApprovedPasswordReset,
  ApprovedPasswordResetModel,
  IApprovedPasswordResetMethods
>(
  {
    userId: {
      type: String,
      required: true,
      min: 24,
      max: 24,
      index: true,
    },
    expDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

approvedPasswordResetSchema.static(
  "createApprovedPasswordReset",
  async function (userId: string, session?: ClientSession) {
    const dbSession = session ? session : await connection.startSession();

    try {
      // Creates a new transaction if no session was provided
      if (!session || !session.inTransaction()) {
        dbSession.startTransaction();
      }

      // Deletes any prior approved password reset
      await this.deleteOne({ userId }, { session: dbSession });

      // Creates a new date for the token's expiration
      const expDate = new Date();
      expDate.setSeconds(
        expDate.getSeconds() +
          parseInt(<string>process.env[envNames.crypto.tempTokenExpSeconds])
      );

      const approvedPasswordResets: DBLoadedApprovedPasswordReset[] =
        await this.create([{ userId, expDate }], { session: dbSession });

      await dbSession.commitTransaction();

      return approvedPasswordResets[0] || null;
    } catch (error) {
      // Aborts the transaction if it was created within this method
      if (!session && dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      return null;
    } finally {
      // Ends the session if it was created within this method
      if (!session) {
        await dbSession.endSession();
      }
    }
  }
);

export const approvedPasswordResetModel = model<
  IApprovedPasswordReset,
  ApprovedPasswordResetModel
>(
  "approved-password-reset",
  approvedPasswordResetSchema,
  "approved-password-reset"
);
