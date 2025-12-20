import { LoadedSsoToken } from "@services/database/table-models/loaded-sso-token";
import { FunctionGetEncryptDecryptKey } from "@services/database/table-models/loaded-sso-token/types";
import { DatabaseSsoToken } from "@services/database/tables/sso-token/types";

/**
 * Retrieves a loaded sso token object as a mock.
 * @param tokenData An object of sso token's data that will be used instead of
 *                  the default values
 * @param getEncryptDecryptKey The function that retrieves the
 *                             encryption/decryption key
 * @returns A loaded sso token object
 */
export function getMockSsoToken(
  tokenData?: Partial<DatabaseSsoToken>,
  getEncryptDecryptKey?: FunctionGetEncryptDecryptKey
): LoadedSsoToken {
  return new LoadedSsoToken(
    {
      expiration_date: new Date().toISOString(),
      sso_key: "fake-sso-key",
      user_id: 1,
      ...tokenData,
    },
    getEncryptDecryptKey ? getEncryptDecryptKey : jest.fn()
  );
}
