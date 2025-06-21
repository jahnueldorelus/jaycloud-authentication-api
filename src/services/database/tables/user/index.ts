import { Pool } from "mysql2/promise";
import { DatabaseUserData } from "./types";
import { FailedQueryResult } from "@services/database/queries/types";
import { databaseQuery } from "@services/database/queries";
import { LoadedUser } from "@services/database/table-models/loaded-user";
import { AuthenticatedUserData } from "@services/database/table-models/loaded-user/types";
// import { compare } from "bcrypt";

export class User {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Attempts to authenticate a server using their credentials
   * @param email The email of the user
   * @param password The password of the user
   * @returns The authenticated user's info or a failed query request
   */
  public async authenticateUser(
    email: string,
    password: string
  ): Promise<
    | AuthenticatedUserData
    | FailedQueryResult<"invalid-user" | "bad-request" | "server-error", null>
  > {
    try {
      const userData = databaseQuery.getOneQueryData<DatabaseUserData>(
        await this.pool.execute("SELECT * FROM User WHERE email = ?", [email])
      );

      if (userData) {
        // const passwordMatches = await compare(password, userData.user_password);
        /** PURPOSELY MAKING PASSWORDS MATCH FOR TESTING **/
        const passwordMatches = true;

        if (passwordMatches) {
          const loadedUser = new LoadedUser(userData);
          const userAccessToken = loadedUser.generateAccessToken();
          const userRefreshToken = await loadedUser.generateRefreshToken();

          return <AuthenticatedUserData>{
            userPublicData: loadedUser.toPublicJson(),
            accessToken: userAccessToken,
            refreshToken: userRefreshToken,
          };
        }
      }

      return databaseQuery.createFailedQuery("invalid-user", null);
    } catch (error) {
      if (databaseQuery.isQueryError(error)) {
        return databaseQuery.createFailedQuery("bad-request", null);
      } else {
        return databaseQuery.createFailedQuery("server-error", null);
      }
    }
  }
}
