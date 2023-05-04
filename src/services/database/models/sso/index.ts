import { ClientSession, connection, model, Schema } from "mongoose";
import CryptoJS from "crypto-js";
import {
  DBLoadedSSO,
  ISSO,
  ISSOMethods,
  SSOModel,
} from "@app-types/database/models/sso";
import { randomUUID } from "crypto";
import { envNames } from "@startup/config";
import { DBLoadedUser } from "@app-types/database/models/users";
import { CookieInfo } from "@app-types/request-success";

/**
 * ANY CHANGES MADE TO THE SCHEMA MUST ALSO BE MADE IN MODEL'S TYPES
 */
const ssoSchema = new Schema<ISSO, SSOModel, ISSOMethods>(
  {
    ssoId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: false,
      minLength: 24,
      maxLength: 24,
      default: null,
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

/**
 * Retrieves the key to encrypt and decrypt an sso token
 * from an sso document.
 * @param userId The id of the user
 */
const getEncryptDecryptKey = (userId: string | null) => {
  const cryptoKey = process.env[envNames.crypto.key];

  if (userId && cryptoKey) {
    return userId + cryptoKey;
  } else {
    return null;
  }
};

/**
 * Generates an encrypted sso token (aka sso id) for a user.
 * @param user The user to create an encrypted sso token for
 */
const createEncryptedToken = (user: DBLoadedUser) => {
  if (!user) {
    return null;
  }

  const encryptionKey = getEncryptDecryptKey(user.id);

  if (!encryptionKey) {
    return null;
  }

  const newSSOToken = randomUUID();
  const encryptedSSOToken = CryptoJS.AES.encrypt(newSSOToken, encryptionKey);

  return encryptedSSOToken.toString();
};

ssoSchema.static(
  "createUserSSOToken",
  async function (
    user: DBLoadedUser,
    expDate: Date,
    givenSession?: ClientSession
  ) {
    const dbSession = givenSession
      ? givenSession
      : await connection.startSession();

    try {
      // Creates a new transaction if no session was provided
      if (!givenSession || !givenSession.inTransaction()) {
        dbSession.startTransaction();
      }

      // Creates a new SSO record to provide SSO functionality across all services
      const encryptedSSOToken = createEncryptedToken(user);

      if (!encryptedSSOToken) {
        throw Error();
      }

      const ssoInfo: ISSO = {
        expDate: expDate,
        ssoId: encryptedSSOToken,
        userId: user.id,
      };

      const [ssoDoc] = await this.create([ssoInfo], {
        session: dbSession,
      });

      if (!ssoDoc) {
        throw Error();
      }

      const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];

      const ssoTokenCookieInfo: CookieInfo = {
        expDate: ssoDoc.expDate,
        key: ssoTokenCookieKey,
        value: ssoDoc.ssoId,
        sameSite: "lax",
      };

      return ssoTokenCookieInfo;
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

ssoSchema.static("getDecryptedToken", function (ssoDoc: DBLoadedSSO) {
  const decryptionKey = getEncryptDecryptKey(ssoDoc.userId);

  if (!decryptionKey) {
    return null;
  }

  const decryptedSSOToken = CryptoJS.AES.decrypt(ssoDoc.ssoId, decryptionKey);

  return decryptedSSOToken.toString(CryptoJS.enc.Utf8);
});

export const ssoModel = model<ISSO, SSOModel>("sso", ssoSchema, "sso");
