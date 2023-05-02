import { HydratedDocument, Model } from "mongoose";
import { DBLoadedUser } from "../users";

export type ISSO = {
  ssoId: string;
  userId: string | null;
  expDate: Date;
};

export type ISSOMethods = {};

export interface SSOModel extends Model<ISSO, {}, ISSOMethods> {
  /**
   * Generates a sso token (aka sso id) for a user.
   */
  createEncryptedToken(user: DBLoadedUser): string | null;

  /**
   * Retrieves the decrypted sso token (aka sso id) of a user.
   * @param encryptedSSOToken The regular encrypted token
   */
  getDecryptedToken(ssoDoc: DBLoadedSSO): string | null;
}

export type DBLoadedSSO = HydratedDocument<ISSO, ISSOMethods>;
