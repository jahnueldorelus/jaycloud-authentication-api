import { FailedQueryResult } from "@services/database/queries/types";
import { Pool } from "mysql2/promise";
import moment from "moment";
import { envNames } from "@startup/config";
import { v4 as createUUID } from "uuid";
import { databaseQuery } from "@services/database/queries";
import { LoadedRefreshToken } from "@services/database/table-models/loaded-refresh-token";
import { DatabaseRefreshTokenData } from "./types";
import { LoadedUser } from "@services/database/table-models/loaded-user";
import { DatabaseUserData } from "../user/types";

export class RefreshToken {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Attempts to create a refresh token.
   * @param familyId The family id of the refresh token family
   */
  public async createRefreshToken(
    familyId: number
  ): Promise<LoadedRefreshToken | FailedQueryResult<"server-error", null>> {
    try {
      // Creates a new date for the token's expiration
      const expDate: moment.Moment = moment(new Date());

      expDate.add(
        parseInt(<string>process.env[envNames.jwt.refreshExpDays]),
        "days"
      );

      // Creates a new token ID
      const token: string = createUUID();

      const refreshTokenData: DatabaseRefreshTokenData | null =
        databaseQuery.getOneQueryData<DatabaseRefreshTokenData>(
          await this.pool.execute("call create_refresh_token(?, ?, ?)", [
            familyId,
            token,
            expDate.toDate(),
          ])
        );

      if (refreshTokenData) {
        return new LoadedRefreshToken(refreshTokenData);
      } else {
        throw Error();
      }
    } catch (error) {
      return databaseQuery.createFailedQuery("server-error", null);
    }
  }

  /**
   * Attempts to expire a refresh token.
   * @param tokenId The id of the token
   * @returns A boolean determining if the token was expired
   */
  public async expireRefreshToken(tokenId: string): Promise<boolean> {
    try {
      await this.pool.execute("DELETE FROM RefreshToken WHERE token = ?", [
        tokenId,
      ]);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Attempts to get the user of a refresh token.
   * @param familyId The family id of the token
   */
  public async getUserOfToken(
    familyId: number
  ): Promise<LoadedUser | FailedQueryResult<"server-error", null>> {
    try {
      const userData: DatabaseUserData | null =
        databaseQuery.getOneQueryData<DatabaseUserData>(
          await this.pool.execute(
            "SELECT User.* FROM User INNER JOIN RefreshTokenFamily ON User.id = RefreshTokenFamily.user_id WHERE RefreshTokenFamily.id = ?",
            familyId
          )
        );

      if (userData) {
        return new LoadedUser(userData);
      } else {
        return databaseQuery.createFailedQuery("server-error", null);
      }
    } catch (error) {
      return databaseQuery.createFailedQuery("server-error", null);
    }
  }
}
