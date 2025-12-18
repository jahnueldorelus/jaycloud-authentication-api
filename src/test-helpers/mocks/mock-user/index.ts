import { LoadedUser } from "@services/database/table-models/loaded-user";
import { DatabaseUserData } from "@services/database/tables/user/types";

/**
 * Retrieves a loaded user object as a mock.
 * @param userData An object of user's data that will be used instead of
 *                 the default values
 * @returns A loaded user object
 */
export function getMockUser(userData?: Partial<DatabaseUserData>): LoadedUser {
  return new LoadedUser({
    created_at: new Date(),
    email: "test@testDomain.com",
    first_name: "Jane",
    id: 1,
    is_admin: 0,
    last_name: "Smith",
    updated_at: new Date(),
    user_password: "test-user-password",
    ...userData,
  });
}
