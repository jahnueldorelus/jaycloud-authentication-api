import { LoadedRefreshToken } from "@services/database/table-models/loaded-refresh-token";
import { DatabaseRefreshTokenData } from "@services/database/tables/refresh-token/types";

/**
 * Retrieves a loaded refresh token object as a mock.
 * @param tokenData An object of the refresh token's data that will be used instead of
 *                  the default values
 * @returns A loaded refresh token object
 */
export function getMockRefreshToken(
  tokenData?: Partial<DatabaseRefreshTokenData>,
): LoadedRefreshToken {
  return new LoadedRefreshToken({
    expiration_date: new Date().toISOString(),
    family_id: "1",
    token: "9ad1df70-bdd5-4696-ba61-38f481492904",
    ...tokenData,
  });
}
