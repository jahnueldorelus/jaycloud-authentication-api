import { ClientSession, HydratedDocument, Model } from "mongoose";
import { DBLoadedUser } from "../users";
import { CookieInfo } from "@app-types/request-success";

export type ISSO = {
  ssoId: string;
  userId: string | null;
  expDate: Date;
};

export type ISSOMethods = {};

export interface SSOModel extends Model<ISSO, {}, ISSOMethods> {
  /**
   * Retrieves the decrypted sso token (aka sso id) of a user.
   * @param encryptedSSOToken The regular encrypted token
   */
  getDecryptedToken(ssoDoc: DBLoadedSSO): string | null;

  /**
   * Generates and saves a sso token (aka sso id) for a user.
   * @param user The user to create a sso token for
   * @param expDate The date the sso token will expire
   * @param givenSession The DB session to use
   * @returns The user's sso token information in a cookie info object
   */
  createUserSSOToken(
    user: DBLoadedUser,
    expDate: Date,
    givenSession?: ClientSession
  ): CookieInfo | null;
}

export type DBLoadedSSO = HydratedDocument<ISSO, ISSOMethods>;
