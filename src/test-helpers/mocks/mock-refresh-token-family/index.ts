import { LoadedRefreshTokenFamily } from "@services/database/table-models/loaded-refresh-token-family";
import { DatabaseRefreshTokenFamilyData } from "@services/database/tables/refresh-token-family/types";

/**
 * Retrieves a loaded refresh token family object as a mock.
 * @param tokenFamilyData An object of the refresh token family's data that will be
 *                        used instead of the default values
 * @returns A loaded refresh token family object
 */
export function getMockRefreshTokenFamily(
  tokenFamilyData?: Partial<DatabaseRefreshTokenFamilyData>
): LoadedRefreshTokenFamily {
  return new LoadedRefreshTokenFamily({
    token: "test-refresh-token-family",
    user_id: 1,
    ...tokenFamilyData,
  });
}
