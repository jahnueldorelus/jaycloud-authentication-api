import {
  DBLoadedTempToken,
  ITempToken,
  ITempTokenMethods,
  TempTokenModel,
} from "@app-types/database/models/temp-token";
import { ClientSession, model, Schema } from "mongoose";
import { connection } from "mongoose";
import { randomBytes } from "crypto";
import { envNames } from "@startup/config";
import moment from "moment";

/**
 * ANY CHANGES MADE TO THE SCHEMA MUST ALSO BE MADE IN MODEL'S TYPES.
 */
const tempTokenSchema = new Schema<
  ITempToken,
  TempTokenModel,
  ITempTokenMethods
>(
  {
    userId: {
      type: String,
      required: true,
      min: 24,
      max: 24,
      index: true,
    },
    token: {
      type: String,
      required: true,
      min: 6,
      max: 6,
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

tempTokenSchema.static(
  "deleteExpiredTokens",
  async function (session?: ClientSession) {
    const dbSession = session ? session : await connection.startSession();

    try {
      // Creates a new transaction if no session was provided
      if (!session || !session.inTransaction()) {
        dbSession.startTransaction();
      }

      const tempTokens = await this.find({}, null, { session: dbSession });

      const expiredTokens = tempTokens.filter((token) => {
        const currentDateAndTime = moment(new Date());

        return moment(token.expDate).isBefore(currentDateAndTime);
      });

      const expiredTokenIds = expiredTokens.map((token) => token.id);

      await this.deleteMany(
        { _id: { $in: expiredTokenIds } },
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

tempTokenSchema.static(
  "createTempToken",
  async function (userId: string, session?: ClientSession) {
    const dbSession = session ? session : await connection.startSession();

    try {
      // Creates a new transaction if no session was provided
      if (!session || !session.inTransaction()) {
        dbSession.startTransaction();
      }

      // Deletes any prior temporary token
      await this.deleteOne({ userId }, { session: dbSession });

      // Generates a temporary token
      const tokenNumber = randomBytes(3).toString("hex").toUpperCase();

      // Creates a new date for the token's expiration
      const expDate = moment(new Date());
      expDate.add(
        parseInt(<string>process.env[envNames.crypto.tempTokenExpMinutes]),
        "minutes"
      );

      const tempTokenList: DBLoadedTempToken[] = await this.create(
        [{ userId, token: tokenNumber, expDate: expDate.toDate() }],
        { session: dbSession }
      );

      await dbSession.commitTransaction();

      return tempTokenList[0] || null;
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

export const tempTokenModel = model<ITempToken, TempTokenModel>(
  "temp-token",
  tempTokenSchema,
  "temp-token"
);
