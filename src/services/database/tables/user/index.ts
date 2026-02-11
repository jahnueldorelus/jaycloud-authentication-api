import { Pool } from "mysql2/promise";
import { DatabaseUserData } from "./types";
import { FailedQueryResult } from "@services/database/queries/types";
import { databaseQuery } from "@services/database/queries";
import { LoadedUser } from "@services/database/table-models/loaded-user";
import { UserAuthorizationCreds } from "@services/database/table-models/loaded-user/types";
import { compare } from "bcrypt";
import { NewUser } from "@app-types/user/new-user";
import { UserUpdateData } from "@app-types/user/update-user";

export class User {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // SQL query for retrieving a user by email
  private get queryGetUserByEmail(): string {
    return "SELECT * FROM User WHERE email = ?";
  }

  /**
   * Retrieves a user's authorization credentials.
   * @param userData The database info of a user
   * @returns An object containing the user's authorization credentials
   */
  private async getUserAuthCredentials(
    userData: DatabaseUserData,
  ): Promise<UserAuthorizationCreds | null> {
    const loadedUser = new LoadedUser(userData);
    return loadedUser.generateAuthCredentials();
  }

  /**
   * Attempts to authenticate a server using their credentials.
   * @param email The email of the user
   * @param password The password of the user
   * @returns The authenticated user's info or a failed query request
   */
  public async authenticateUser(
    email: string,
    password: string,
  ): Promise<
    | UserAuthorizationCreds
    | FailedQueryResult<
        "invalid-user" | "invalid-password" | "server-error",
        null
      >
  > {
    try {
      const userData = databaseQuery.getOneQueryData<DatabaseUserData>(
        await this.pool.execute(this.queryGetUserByEmail, [email]),
      );

      if (!userData) {
        return databaseQuery.createFailedQuery("invalid-user", null);
      }

      const passwordMatches = await compare(password, userData.user_password);

      if (passwordMatches) {
        const authenticatedUserData =
          await this.getUserAuthCredentials(userData);

        if (!authenticatedUserData) {
          throw Error("Failed to retrieve user's authenticated info");
        } else {
          return authenticatedUserData;
        }
      } else {
        return databaseQuery.createFailedQuery("invalid-password", null);
      }
    } catch (error) {
      return databaseQuery.createFailedQuery("server-error", null);
    }
  }

  /**
   * Attempts to retrieve a user by their email.
   * @param userEmail The user's email
   * @returns The user's data if found. Otherwise null
   */
  public async getUserByEmail(userEmail: string): Promise<LoadedUser | null> {
    try {
      const userData = databaseQuery.getOneQueryData<DatabaseUserData>(
        await this.pool.execute(this.queryGetUserByEmail, [userEmail]),
      );

      return userData ? new LoadedUser(userData) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Attempts to retrieve a user by their id.
   * @param userId The user's id
   * @returns The user's data if found. Otherwise null
   */
  public async getUserById(userId: number): Promise<LoadedUser | null> {
    try {
      const userData = databaseQuery.getOneQueryData<DatabaseUserData>(
        await this.pool.execute("SELECT * FROM USER WHERE id = ?", [userId]),
      );

      return userData ? new LoadedUser(userData) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Attempts to create a new user.
   * @param newUserInfo The new user's info
   * @returns The newly created user or a failed query request
   */
  public async createUser(
    newUserInfo: NewUser,
  ): Promise<
    | UserAuthorizationCreds
    | FailedQueryResult<"server-error" | "duplicate-user", null>
  > {
    try {
      const userData = databaseQuery.getOneQueryData<DatabaseUserData>(
        await this.pool.execute("call create_user(?,?,?,?,?)", [
          newUserInfo.firstName,
          newUserInfo.lastName,
          newUserInfo.email,
          newUserInfo.password,
          newUserInfo.isAdmin || false, // Defaults to false if no admin property is provided,
        ]),
      );

      if (!userData) {
        return databaseQuery.createFailedQuery("server-error", null);
      } else {
        const authenticatedUserData =
          await this.getUserAuthCredentials(userData);

        if (!authenticatedUserData) {
          throw Error("Failed to retrieve user's authenticated info");
        } else {
          return authenticatedUserData;
        }
      }
    } catch (error) {
      if (
        databaseQuery.isQueryError(error) &&
        error.code === databaseQuery.mysqlQueryError.duplicateEntry.errorCode
      ) {
        return databaseQuery.createFailedQuery("duplicate-user", null);
      } else {
        return databaseQuery.createFailedQuery("server-error", null);
      }
    }
  }

  /**
   * Attempts to update a user.
   * @param userEmail The user's email
   * @param userUpdatedInfo The user's updated information to save
   * @returns The user's updated data. Otherwise null if an error occurs
   */
  public async updateUser(
    userEmail: string,
    userUpdatedInfo: UserUpdateData,
  ): Promise<UserAuthorizationCreds | FailedQueryResult<"server-error", null>> {
    try {
      const userData = databaseQuery.getOneQueryData<DatabaseUserData>(
        await this.pool.execute("call update_user(?,?,?,?)", [
          userUpdatedInfo.firstName || null,
          userUpdatedInfo.lastName || null,
          userUpdatedInfo.password || null,
          userEmail,
        ]),
      );

      if (!userData) {
        return databaseQuery.createFailedQuery("server-error", null);
      }

      const authenticatedUserData = await this.getUserAuthCredentials(userData);

      if (!authenticatedUserData) {
        throw Error("Failed to retrieve user's authenticated info");
      } else {
        return authenticatedUserData;
      }
    } catch (error) {
      return databaseQuery.createFailedQuery("server-error", null);
    }
  }
}
