import { model, Schema } from "mongoose";
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

ssoSchema.static("createEncryptedToken", function (user: DBLoadedUser) {
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
});

ssoSchema.static("getDecryptedToken", function (ssoDoc: DBLoadedSSO) {
  const decryptionKey = getEncryptDecryptKey(ssoDoc.userId);

  if (!decryptionKey) {
    return null;
  }

  const decryptedSSOToken = CryptoJS.AES.decrypt(ssoDoc.ssoId, decryptionKey);

  return decryptedSSOToken.toString(CryptoJS.enc.Utf8);
});

export const ssoModel = model<ISSO, SSOModel>("sso", ssoSchema, "sso");
