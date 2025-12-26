import { db } from "@services/database";
import { DatabaseRefreshTokenFamilyData } from "@services/database/tables/refresh-token-family/types";

export class LoadedRefreshTokenFamily {
  public readonly token: string;
  public readonly userId: number;
  public readonly expirationDate: Date;

  constructor(tokenData: DatabaseRefreshTokenFamilyData) {
    this.token = tokenData.token;
    this.userId = tokenData.user_id;
    this.expirationDate = new Date(tokenData.expiration_date);
  }

  /**
   * Attempts to delete the refresh token.
   */
  public async deleteTokenFamily(): Promise<boolean> {
    return await db.refreshTokenFamily.deleteFamily(this.token);
  }
}
