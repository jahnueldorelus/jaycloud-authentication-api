import {
  DBLoadedRefreshTokenFamily,
  IRefreshTokenFamily,
  IRefreshTokenFamilyMethods,
  RefreshTokenFamilyModel,
} from "@app-types/database/models/refresh-token-families";
import { dbAuth } from "@services/database";
import { ClientSession, model, Schema } from "mongoose";
import { connection } from "mongoose";

/**
 * ANY CHANGES MADE TO THE SCHEMA MUST ALSO BE MADE IN MODEL'S TYPES
 */
const refreshTokenFamiliesSchema = new Schema<
  IRefreshTokenFamily,
  RefreshTokenFamilyModel,
  IRefreshTokenFamilyMethods
>(
  {
    userId: {
      type: String,
      required: true,
      min: 24,
      max: 24,
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenFamiliesSchema.static(
  "createTokenFamily",
  async function (userId: string, session?: ClientSession) {
    const dbSession = session ? session : await connection.startSession();

    try {
      // Creates a new transaction if no session was provided
      if (!session || !session.inTransaction()) {
        dbSession.startTransaction();
      }

      const refreshTokenFamilies: DBLoadedRefreshTokenFamily[] =
        await this.create([{ userId }], { session: dbSession });
      await dbSession.commitTransaction();

      return refreshTokenFamilies[0] || null;
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

refreshTokenFamiliesSchema.method<DBLoadedRefreshTokenFamily>(
  "deleteFamily",
  async function (session?: ClientSession) {
    const dbSession = session ? session : await connection.startSession();

    try {
      // Creates a new transaction if no session was provided
      if (!session || !session.inTransaction()) {
        dbSession.startTransaction();
      }

      await dbAuth.refreshTokensModel
        .deleteMany({ familyId: this.id })
        .session(dbSession);
      await this.delete({ session: dbSession });

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

export const refreshTokenFamiliesModel = model<
  IRefreshTokenFamily,
  RefreshTokenFamilyModel
>(
  "refresh-token-families",
  refreshTokenFamiliesSchema,
  "refresh-token-families"
);
