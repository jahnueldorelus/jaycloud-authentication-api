import { db } from "@services/database";
import { DatabaseRefreshTokenData } from "@services/database/tables/refresh-token/types";

export class LoadedRefreshToken {
  public readonly token: string;
  public readonly expDate: Date;
  public readonly familyId: number;

  constructor(refreshTokenData: DatabaseRefreshTokenData) {
    this.token = refreshTokenData.token;
    this.expDate = new Date(refreshTokenData.expiration_date);
    this.familyId = refreshTokenData.family_id;
  }

  /**
   * Determines if the token is expired.
   * @returns A boolean determining if the token is expired
   */
  public isTokenExpired(): boolean {
    return this.expDate.getTime() < new Date().getTime();
  }

  /**
   * Attempts to expire the token immediately.
   * @returns A boolean determining if the token was expired
   */
  public async expireToken(): Promise<boolean> {
    return await db.refreshToken.expireRefreshToken(this.token);
  }

  /**
   * Attempts to get the user of the token.
   * @returns The user associated with the token or a failed query error
   */
  public async getUser(): ReturnType<typeof db.refreshToken.getUserOfToken> {
    return await db.refreshToken.getUserOfToken(this.familyId);
  }
}
