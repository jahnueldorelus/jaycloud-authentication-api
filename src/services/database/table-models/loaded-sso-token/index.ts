import { DatabaseSsoToken } from "@services/database/tables/sso-token/types";

export class LoadedSsoToken {
  public readonly ssoKey: string;
  public readonly userId: number;
  public readonly expDate: Date;

  constructor(ssoTokenData: DatabaseSsoToken) {
    this.ssoKey = ssoTokenData.sso_key;
    this.expDate = new Date(ssoTokenData.expiration_date);
    this.userId = ssoTokenData.user_id;
  }
}
