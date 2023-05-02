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
      minLength: 24,
      maxLength: 24,
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenFamiliesSchema.static(
  "createTokenFamily",
  async function (userId: string, givenSession?: ClientSession) {
    const dbSession = givenSession
      ? givenSession
      : await connection.startSession();

    try {
      // Creates a new transaction if no session was provided
      if (!givenSession || !givenSession.inTransaction()) {
        dbSession.startTransaction();
      }

      const refreshTokenFamilies: DBLoadedRefreshTokenFamily[] =
        await this.create([{ userId }], { session: dbSession });

      // Commits the transaction if it was created within this method
      if (!givenSession) {
        await dbSession.commitTransaction();
      }

      return refreshTokenFamilies[0] || null;
    } catch (error) {
      // Aborts the transaction if it was created within this method
      if (!givenSession && dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      return null;
    } finally {
      // Ends the session if it was created within this method
      if (!givenSession) {
        await dbSession.endSession();
      }
    }
  }
);

refreshTokenFamiliesSchema.method<DBLoadedRefreshTokenFamily>(
  "deleteFamily",
  async function (givenSession?: ClientSession) {
    const dbSession = givenSession
      ? givenSession
      : await connection.startSession();

    try {
      // Creates a new transaction if no session was provided
      if (!givenSession || !givenSession.inTransaction()) {
        dbSession.startTransaction();
      }

      await dbAuth.refreshTokensModel
        .deleteMany({ familyId: this.id })
        .session(dbSession);
      await this.delete({ session: dbSession });

      // Commits the transaction if it was created within this method
      if (!givenSession) {
        await dbSession.commitTransaction();
      }

      return true;
    } catch (error) {
      // Aborts the transaction if it was created within this method
      if (!givenSession && dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      return false;
    } finally {
      // Ends the session if it was created within this method
      if (!givenSession) {
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
