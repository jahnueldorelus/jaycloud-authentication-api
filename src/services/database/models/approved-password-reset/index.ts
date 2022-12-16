import {
  DBLoadedApprovedPasswordReset,
  IApprovedPasswordReset,
  IApprovedPasswordResetMethods,
  ApprovedPasswordResetModel,
} from "@app-types/database/models/approved-password-reset";
import { envNames } from "@startup/config";
import { randomBytes } from "crypto";
import moment from "moment";
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
    token: { type: String, required: true, min: 24, max: 24 },
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
  "deleteExpiredApprovedPassResets",
  async function (session?: ClientSession) {
    const dbSession = session ? session : await connection.startSession();

    try {
      // Creates a new transaction if no session was provided
      if (!session || !session.inTransaction()) {
        dbSession.startTransaction();
      }

      const approvedPasswordResets = await this.find({}, null, {
        session: dbSession,
      });

      const expiredApprovedPassResets = approvedPasswordResets.filter(
        (approvedPassReset) => {
          const currentDateAndTime = moment(new Date());

          return moment(approvedPassReset.expDate).isBefore(currentDateAndTime);
        }
      );

      const expiredApprovedPassResetIds = expiredApprovedPassResets.map(
        (approvedPasswordReset) => approvedPasswordReset.id
      );

      await this.deleteMany(
        { _id: { $in: expiredApprovedPassResetIds } },
        { session: dbSession }
      );

      await dbSession.commitTransaction();

      return true;
    } catch (error) {
      // Aborts the transaction if it was created within this method
      if (!session && dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      return false;
    } finally {
      // Ends the session if it was created within this method
      if (!session) {
        await dbSession.endSession();
      }
    }
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

      // Generates a token
      const token = randomBytes(12).toString("hex");

      // Creates a new date for the token's expiration
      const expDate = moment(new Date());
      expDate.add(
        parseInt(<string>process.env[envNames.crypto.tempTokenExpMinutes]),
        "minutes"
      );

      const approvedPasswordResets: DBLoadedApprovedPasswordReset[] =
        await this.create([{ userId, token, expDate: expDate.toDate() }], {
          session: dbSession,
        });

      await dbSession.commitTransaction();

      return approvedPasswordResets[0] || null;
    } catch (error: any) {
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
