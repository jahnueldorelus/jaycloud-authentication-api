import { Pool } from "mysql2/promise";
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
   * Retrieves the new expiration date/time for a new approved password reset.
   */
  private getPasswordResetExpiration(): Date {
    const expDate = new Date();
    const numOfMinutesToAddToDate = parseInt(
      <string>process.env[envNames.crypto.tempTokenExpMinutes]
    );
    expDate.setMinutes(expDate.getMinutes() + numOfMinutesToAddToDate);

    return expDate;
  }

  /**
   * Converts a Javascript date format into the MySQL format.
   * @param dateToConvert The date to convert to a MySQL format
   * @returns The MySQL formatted date
   */
  private convertDateToMysqlFormat(dateToConvert: Date): string {
    const year = dateToConvert.getFullYear();
    const month = String(dateToConvert.getMonth() + 1).padStart(2, "0");
    const day = String(dateToConvert.getDate()).padStart(2, "0");
    const hours = dateToConvert.getHours();
    const minutes = dateToConvert.getMinutes();
    const seconds = dateToConvert.getSeconds();

    // Creates the format "YYYY-MM-DD HH:MM:SS"
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Attempts to delete all expired approved password resets.
   * @returns A boolean that determines if the expired approved password
   *          resets were deleted
   */
  public async deleteExpiredApprovedPasswordResets(): Promise<boolean> {
    const currentDateTime = this.convertDateToMysqlFormat(new Date());

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
      const expDate = this.getPasswordResetExpiration();

      const approvedPasswordReset: DatabaseApprovedPasswordResetData | null =
        databaseQuery.getOneQueryData<DatabaseApprovedPasswordResetData>(
          await this.pool.execute(
            "call create_approved_password_reset(?, ?, ?)",
            [userId, token, this.convertDateToMysqlFormat(expDate)]
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
   * Attempts to get an approved password reset by a token.
   * @param token The token of the approved password reset
   */
  public async getAprByToken(
    token: string
  ): Promise<
    LoadedApprovedPasswordReset | FailedQueryResult<"server-error", null>
  > {
    try {
      const approvedPasswordResetData: DatabaseApprovedPasswordResetData | null =
        databaseQuery.getOneQueryData<DatabaseApprovedPasswordResetData>(
          await this.pool.execute(
            "SELECT * FROM ApprovedPasswordReset WHERE token = ?",
            [token]
          )
        );

      if (approvedPasswordResetData) {
        return new LoadedApprovedPasswordReset(approvedPasswordResetData);
      } else {
        throw Error("The approved password reset was not found");
      }
    } catch (error) {
      return databaseQuery.createFailedQuery("server-error", null);
    }
  }

  /**
   * Attempts to get the user of an approved password reset by their id.
   * @param userId The user id of the approved password reset
   */
  public async getUserById(
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
