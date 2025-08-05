import { Pool } from "mysql2/promise";
import { DatabaseUserData } from "./types";
import { FailedQueryResult } from "@services/database/queries/types";
import { databaseQuery } from "@services/database/queries";
import { LoadedUser } from "@services/database/table-models/loaded-user";
import { AuthenticatedUserData } from "@services/database/table-models/loaded-user/types";
import { compare } from "bcrypt";
import { NewUser } from "@app-types/user/new-user";

export class User {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Retrieves the authenticated data of a user.
   * @param userData The database info of a user
   * @returns An object of the authenticated user's data
   */
  private async getUserAuthenticatedData(
    userData: DatabaseUserData
  ): Promise<AuthenticatedUserData | null> {
    const loadedUser = new LoadedUser(userData);
    const accessToken = loadedUser.generateAccessToken();
    const refreshTokenOrigins = await loadedUser.generateRefreshTokenOrigins();

    if (refreshTokenOrigins) {
      const ssoToken = await loadedUser.generateSsoToken(
        refreshTokenOrigins.refreshToken.expDate
      );

      if (ssoToken) {
        return <AuthenticatedUserData>{
          userPublicInfo: loadedUser.getPublicInfoJson(),
          accessToken,
          refreshToken: refreshTokenOrigins.refreshToken,
          refreshTokenFamily: refreshTokenOrigins.refreshTokenFamily,
          ssoToken,
        };
      }
    }

    return null;
  }

  /**
   * Attempts to authenticate a server using their credentials.
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

      if (!userData) {
        return databaseQuery.createFailedQuery("invalid-user", null);
      }

      const passwordMatches = await compare(password, userData.user_password);

      if (passwordMatches) {
        const authenticatedUserData = await this.getUserAuthenticatedData(
          userData
        );

        if (!authenticatedUserData) {
          throw Error("Failed to retrieve user's authenticated info");
        } else {
          return authenticatedUserData;
        }
      } else {
        throw databaseQuery.createFailedQuery("Password doesn't match", null);
      }
    } catch (error) {
      if (databaseQuery.isQueryError(error)) {
        return databaseQuery.createFailedQuery("bad-request", null);
      }

      return databaseQuery.createFailedQuery("server-error", null);
    }
  }

  /**
   * Attempts to create a new user.
   * @param newUserInfo The new user's info
   * @returns The newly created user or a failed query request
   */
  public async createUser(
    newUserInfo: NewUser
  ): Promise<AuthenticatedUserData | FailedQueryResult<"server-error", null>> {
    try {
      const userData = databaseQuery.getOneQueryData<DatabaseUserData>(
        await this.pool.execute("call create_user(?,?,?,?,?)", [
          newUserInfo.firstName,
          newUserInfo.lastName,
          newUserInfo.email,
          newUserInfo.password,
          newUserInfo.isAdmin,
        ])
      );

      if (!userData) {
        return databaseQuery.createFailedQuery("server-error", null);
      } else {
        const authenticatedUserData = await this.getUserAuthenticatedData(
          userData
        );

        if (!authenticatedUserData) {
          throw Error("Failed to retrieve user's authenticated info");
        } else {
          return authenticatedUserData;
        }
      }
    } catch (error) {
      return databaseQuery.createFailedQuery("server-error", null);
    }
  }
}
