import { Pool } from "mysql2/promise";
import moment from "moment";
import { envNames } from "@startup/config";
import { randomBytes } from "crypto";
import { DatabaseApprovedPasswordResetData } from "./types";
import { LoadedApprovedPasswordReset } from "@services/database/table-models/loaded-approved-password-reset";
import { databaseQuery } from "@services/database/queries";
import { LoadedUser } from "@services/database/table-models/loaded-user";
import { FailedQueryResult } from "@services/database/queries/types";
import { DatabaseUserData } from "../user/types";

export class ApprovedPasswordReset {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Attempts to delete all expired approved password resets.
   * @returns A boolean that determines if the expired approved password
   *          resets were deleted
   */
  public async deleteExpiredApprovedPasswordResets(): Promise<boolean> {
    const currentDateTime = new Date()
      .toISOString()
      .replace(RegExp("/[TZ]/g"), "");

    try {
      await this.pool.execute(
        "DELETE FROM ApprovedPasswordReset WHERE expiration_date < ?",
        [currentDateTime]
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Attempts to create an approved password reset.
   * @param userId The id of the user to create an approved password reset for
   * @returns A loaded approved password reset or a failed database query.
   */
  public async createApprovedPasswordReset(userId: number) {
    try {
      // Deletes any prior approved password reset
      await this.pool.execute(
        "DELETE FROM ApprovedPasswordReset WHERE user_id = ?",
        [userId]
      );

      // Generates a token
      const token = randomBytes(12).toString("hex");

      // Creates a new date for the token's expiration
      const expDate = moment(new Date());
      expDate.add(
        parseInt(<string>process.env[envNames.crypto.tempTokenExpMinutes]),
        "minutes"
      );

      const approvedPasswordReset: DatabaseApprovedPasswordResetData | null =
        databaseQuery.getOneQueryData<DatabaseApprovedPasswordResetData>(
          await this.pool.execute(
            "call create_approved_password_reset(?, ?, ?)",
            [userId, token, expDate.toDate()]
          )
        );

      if (approvedPasswordReset) {
        return new LoadedApprovedPasswordReset(approvedPasswordReset);
      } else {
        throw Error();
      }
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Attempts to delete an approved password reset.
   * @param token The token of the approved password reset
   * @returns A boolean determining if the approved password reset was deleted
   */
  public async deleteApprovedPasswordReset(token: string): Promise<boolean> {
    try {
      await this.pool.execute(
        "DELETE FROM ApprovedPasswordReset WHERE token = ?",
        [token]
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Attempts to get the user of an approved password reset.
   * @param userId The user id of the approved password reset
   */
  public async getUserOfApprovedPasswordReset(
    userId: number
  ): Promise<LoadedUser | FailedQueryResult<"server-error", null>> {
    try {
      const userData: DatabaseUserData | null =
        databaseQuery.getOneQueryData<DatabaseUserData>(
          await this.pool.execute(
            "SELECT User.* FROM User INNER JOIN ApprovedPasswordReset ON User.id = ApprovedPasswordReset.user_id WHERE User.id = ?",
            [userId]
          )
        );

      if (userData) {
        return new LoadedUser(userData);
      } else {
        throw Error(
          "The user associated with the approved password reset was not found"
        );
      }
    } catch (error) {
      return databaseQuery.createFailedQuery("server-error", null);
    }
  }
}
