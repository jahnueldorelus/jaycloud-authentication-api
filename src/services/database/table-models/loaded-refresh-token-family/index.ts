import { db } from "@services/database";
import { DatabaseRefreshTokenFamilyData } from "@services/database/tables/refresh-token-family/types";

export class LoadedRefreshTokenFamily {
  public readonly id: number;
  public readonly userId: number;

  constructor(tokenData: DatabaseRefreshTokenFamilyData) {
    this.id = tokenData.id;
    this.userId = tokenData.user_id;
  }

  /**
   * Attempts to delete the refresh token.
   */
  public async deleteTokenFamily(): Promise<boolean> {
    return await db.refreshTokenFamily.deleteFamily(this.id);
  }
}
