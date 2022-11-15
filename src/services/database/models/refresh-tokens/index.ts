import {
  DBLoadedRefreshToken,
  IRefreshToken,
  IRefreshTokenMethods,
  RefreshTokenModel,
} from "@app-types/database/models/refresh-tokens";
import { ClientSession, model, Schema } from "mongoose";
import { v4 as createUUID } from "uuid";
import { connection } from "mongoose";
import { dbAuth } from "@services/database";
import { DBLoadedUser } from "@app-types/database/models/users";
import { envNames } from "@startup/config";

/**
 * ANY CHANGES MADE TO THE SCHEMA MUST ALSO BE MADE IN MODEL'S TYPES
 */
const refreshTokensSchema = new Schema<
  IRefreshToken,
  RefreshTokenModel,
  IRefreshTokenMethods
>(
  {
    token: {
      type: String,
      required: true,
      min: 36,
      max: 36,
    },
    expDate: {
      type: Date,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      min: 24,
      max: 24,
    },
    familyId: {
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

refreshTokensSchema.static(
  "createToken",
  async function (userId: string, familyId: string, session?: ClientSession) {
    const dbSession = session ? session : await connection.startSession();

    try {
      // Creates a new date for the token's expiration
      const expDate = new Date();

      // Sets the date's expiration time
      expDate.setSeconds(
        expDate.getSeconds() +
          parseInt(<string>process.env[envNames.jwt.refreshExpiration])
      );

      // Creates a new token ID
      const token = createUUID();

      // Creates a new transaction if no session was provided
      if (!session || !session.inTransaction()) {
        dbSession.startTransaction();
      }

      const refreshTokens: DBLoadedRefreshToken[] = await this.create(
        [{ token, expDate, userId, familyId }],
        { session: dbSession }
      );
      await dbSession.commitTransaction();

      return refreshTokens[0] || null;
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

refreshTokensSchema.method<DBLoadedRefreshToken>("isExpired", function () {
  return this.expDate.getTime() < new Date().getTime();
});

refreshTokensSchema.method<DBLoadedRefreshToken>(
  "expireToken",
  async function (session?: ClientSession) {
    const dbSession = session ? session : await connection.startSession();

    try {
      // Creates a new transaction if no session was provided
      if (!session || !session.inTransaction()) {
        dbSession.startTransaction();
      }

      this.expDate = new Date();
      await this.save({ session: dbSession });

      await dbSession.commitTransaction();
    } catch (error) {
      // Aborts the transaction if it was created within this method
      if (!session && dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }
    } finally {
      // Ends the session if it was created within this method
      if (!session) {
        await dbSession.endSession();
      }
    }
  }
);

refreshTokensSchema.method<DBLoadedRefreshToken>(
  "getUser",
  async function (session?: ClientSession) {
    const dbSession = session ? session : await connection.startSession();

    try {
      // Creates a new transaction if no session was provided
      if (!session || !session.inTransaction()) {
        dbSession.startTransaction();
      }

      const refreshTokenUser: DBLoadedUser | null = await dbAuth.usersModel
        .findById(this.userId)
        .session(dbSession);
      await dbSession.commitTransaction();

      return refreshTokenUser || null;
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

export const refreshTokensModel = model<IRefreshToken, RefreshTokenModel>(
  "refresh-tokens",
  refreshTokensSchema,
  "refresh-tokens"
);
