import { databaseQuery } from "@services/database/queries";
import { FailedQueryResult } from "@services/database/queries/types";
import { Pool } from "mysql2/promise";
import { DatabaseRefreshTokenFamilyData } from "./types";
import { LoadedRefreshTokenFamily } from "@services/database/table-models/loaded-refresh-token-family";
import { v4 as createUUID } from "uuid";
import { envNames } from "@startup/config";

export class RefreshTokenFamily {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Attempts to create a refresh token family.
   * @param userId The id of the user associated with the refresh token
   * @returns A refresh token family object or a failed query request
   */
  public async createFamily(
    userId: number
  ): Promise<
    | LoadedRefreshTokenFamily
    | FailedQueryResult<"invalid-user" | "server-error", null>
  > {
    try {
      // Creates a new date for the token's expiration
      const tokenExpDate = new Date();
      const numOfDaysTokenIsValid = parseInt(
        <string>process.env[envNames.jwt.refreshExpDays]
      );

      if (Number.isNaN(numOfDaysTokenIsValid)) {
        throw Error(
          "Number of days token is valid retrieved from ENV is not a number"
        );
      }

      tokenExpDate.setDate(tokenExpDate.getDate() + numOfDaysTokenIsValid);
      const token: string = createUUID();

      const refreshTokenFamilyData =
        databaseQuery.getOneQueryData<DatabaseRefreshTokenFamilyData>(
          await this.pool.execute("call create_refresh_token_family(?,?,?)", [
            token,
            userId,
            tokenExpDate,
          ])
        );

      if (refreshTokenFamilyData) {
        return new LoadedRefreshTokenFamily(refreshTokenFamilyData);
      }

      return databaseQuery.createFailedQuery("server-error", null);
    } catch (error) {
      if (
        databaseQuery.isQueryError(error) &&
        error.sqlMessage === "invalid-user"
      ) {
        return databaseQuery.createFailedQuery("invalid-user", null);
      } else {
        return databaseQuery.createFailedQuery("server-error", null);
      }
    }
  }

  /**
   * Attempts to delete a refresh token family.
   * @param familyId The family id of the refresh token
   * @returns A boolean that determines if a refresh token family was deleted.
   */
  public async deleteFamily(familyId: string): Promise<boolean> {
    try {
      await this.pool.execute(
        "DELETE FROM RefreshTokenFamily WHERE token = (?)",
        [familyId]
      );

      return true;
    } catch (error) {
      return false;
    }
  }
}
