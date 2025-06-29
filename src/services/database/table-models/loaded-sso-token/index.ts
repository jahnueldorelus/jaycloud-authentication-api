import { DatabaseSsoToken } from "@services/database/tables/sso-token/types";

export class LoadedSsoToken {
  public readonly ssoKey: string;
  public readonly userId: number;
  public readonly expDate: Date;
  private getEncryptDecryptKey: (userId: number | null) => string | null;

  constructor(
    ssoTokenData: DatabaseSsoToken,
    getEncryptDecryptKey: typeof this.getEncryptDecryptKey
  ) {
    this.ssoKey = ssoTokenData.sso_key;
    this.expDate = new Date(ssoTokenData.expiration_date);
    this.userId = ssoTokenData.user_id;
    this.getEncryptDecryptKey = getEncryptDecryptKey;
  }

  /**
   * Retrieves the decrypted value of the SSO token.
   * @returns The decrypted token or null
   */
  public getDecryptedToken(): string | null {
    const decryptionKey = this.getEncryptDecryptKey(this.userId);

    if (!decryptionKey) {
      return null;
    }

    const decryptedSSOToken = CryptoJS.AES.decrypt(this.ssoKey, decryptionKey);

    return decryptedSSOToken.toString(CryptoJS.enc.Utf8);
  }
}
