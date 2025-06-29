import { envNames } from "@startup/config";
import { Pool } from "mysql2/promise";
import { randomUUID } from "crypto";
import { FailedQueryResult } from "@services/database/queries/types";
import { databaseQuery } from "@services/database/queries";
import { DatabaseSsoToken } from "./types";
import { LoadedSsoToken } from "@services/database/table-models/loaded-sso-token";
import { AES } from "crypto-js";

export class SsoToken {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Retrieves the key to encrypt and decrypt an sso token
   * from an sso document.
   * @param userId The id of the user
   * @returns The encryption & decryption key or null
   */
  private getEncryptDecryptKey(userId: number | null): string | null {
    const cryptoKey = process.env[envNames.crypto.key];

    if (userId && cryptoKey) {
      return userId + cryptoKey;
    } else {
      return null;
    }
  }

  /**
   * Generates an encrypted token.
   * @param userId The id of the user to create an encrypted token for
   * @returns A an encrypted token as a string. Otherwise null
   */
  private createEncryptedToken(userId: number): string | null {
    const encryptionKey = this.getEncryptDecryptKey(userId);

    if (!encryptionKey) {
      return null;
    }

    const randomToken = randomUUID();
    const encryptedToken = AES.encrypt(randomToken, encryptionKey);

    return encryptedToken.toString();
  }

  /**
   * Attempts to create a SSO token.
   * @param userId The id of the user to create a SSO token for
   * @param expDate The date the SSO token will expire
   * @returns The SSO token created or a failed query result
   */
  public async createToken(
    userId: number,
    expDate: Date
  ): Promise<LoadedSsoToken | FailedQueryResult<"server-error", null>> {
    try {
      const ssoTokenId = this.createEncryptedToken(userId);

      const ssoTokenData = databaseQuery.getOneQueryData<DatabaseSsoToken>(
        await this.pool.execute("call create_sso_token(?, ?, ?)", [
          ssoTokenId,
          userId,
          expDate,
        ])
      );

      if (ssoTokenData) {
        return new LoadedSsoToken(ssoTokenData, this.getEncryptDecryptKey);
      } else {
        throw Error();
      }
    } catch (error) {
      return databaseQuery.createFailedQuery("server-error", null);
    }
  }

  /**
   * Attempts to retrieve a SSO token.
   * @param ssoKey The id of the SSO token
   */
  public async getToken(
    ssoKey: number
  ): Promise<
    LoadedSsoToken | FailedQueryResult<"server-error" | "invalid-request", null>
  > {
    try {
      const ssoTokenData = databaseQuery.getOneQueryData<DatabaseSsoToken>(
        await this.pool.execute("SELECT * FROM SsoToken WHERE sso_key = ?", [
          ssoKey,
        ])
      );

      if (!ssoTokenData) {
        return databaseQuery.createFailedQuery("invalid-request", null);
      } else {
        return new LoadedSsoToken(ssoTokenData, this.getEncryptDecryptKey);
      }
    } catch (error) {
      return databaseQuery.createFailedQuery("server-error", null);
    }
  }
}
