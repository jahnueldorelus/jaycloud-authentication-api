import { db } from "@services/database";
import { DatabaseApprovedPasswordResetData } from "@services/database/tables/approved-password-reset/types";

export class LoadedApprovedPasswordReset {
  public readonly id: number;
  public readonly userId: number;
  public readonly token: string;
  public readonly expirationDate: Date;

  constructor(approvedPasswordResetData: DatabaseApprovedPasswordResetData) {
    this.id = approvedPasswordResetData.id;
    this.userId = approvedPasswordResetData.user_id;
    this.token = approvedPasswordResetData.token;
    this.expirationDate = new Date(approvedPasswordResetData.expiration_date);
  }

  /**
   * Determines if the token is expired.
   * @returns A boolean determining if the token is expired
   */
  public get tokenIsExpired(): boolean {
    return this.expirationDate.getTime() < new Date().getTime();
  }

  /**
   * Attempts to expire the token immediately.
   * @returns A boolean determining if the token was expired
   */
  public async expireToken(): ReturnType<
    typeof db.approvedPasswordReset.deleteApprovedPasswordReset
  > {
    return await db.approvedPasswordReset.deleteApprovedPasswordReset(
      this.token
    );
  }

  /**
   * Attempts to get the user of the token.
   * @returns The user associated with the token or a failed query error
   */
  public async getUser(): ReturnType<typeof db.refreshToken.getUserOfToken> {
    return await db.approvedPasswordReset.getUserById(this.userId);
  }
}
