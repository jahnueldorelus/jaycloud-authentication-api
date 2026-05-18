import checkConfig from "@startup/config";
import { envNames } from "@startup/config";

/**
 * Sets a fake value into process.env for every environment variable name that can be found
 * in an object given to parse.
 * @param parentKey The parent key to index the parent object
 * @param parentObject An object containing a key(s) of environment variable names
 */
function setEnvironmentVariables(
  parentKey: string,
  parentObject: Record<string, any>,
) {
  const childValue = <string | typeof parentObject>parentObject[parentKey];

  if (typeof childValue !== "string") {
    for (const childKey of Object.keys(childValue)) {
      setEnvironmentVariables(childKey, childValue);
    }
  } else {
    process.env[childValue] = "fake-environment-variable-value";
  }
}

describe("Startup - Configuration", () => {
  it("Should pass - No missing environment variables", () => {
    for (const key of Object.keys(envNames)) {
      setEnvironmentVariables(key, envNames);
    }

    const { configComplete, error } = checkConfig();

    if (configComplete === false) {
      console.log("CONFIG NOT COMPLETE:", error);
    }
    expect(configComplete).toBe(true);
    expect(error).toBeNull();
  });

  it("Should fail - Missing database environment variables", () => {
    envNames.db.host = "fake-db-env-host";
    envNames.db.name = "fake-db-env-name";
    envNames.db.password = "fake-db-env-password";
    envNames.db.user = "fake-db-env-user";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });

  it("Should fail - Missing JWT environment variables", () => {
    envNames.jwt.accessExpiration = "fake-jwt-env-accessExpiration";
    envNames.jwt.accessReqHeader = "fake-jwt-env-accessReqHeader";
    envNames.jwt.alg = "fake-jwt-env-alg";
    envNames.jwt.privateKey = "fake-jwt-env-privateKey";
    envNames.jwt.publicKey = "fake-jwt-env-publicKey";
    envNames.jwt.refreshExpDays = "fake-jwt-env-refreshExpDays";
    envNames.jwt.refreshReqHeader = "fake-jwt-env-refreshReqHeader";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });

  it("Should fail - Missing access control environment variables", () => {
    envNames.origins.domain = "fake-origins-env-domain";
    envNames.origins.local = "fake-origins-env-local";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });

  it("Should fail - Missing crypto environment variables", () => {
    envNames.crypto.key = "fake-crypto-env-key";
    envNames.crypto.tempTokenExpMinutes = "fake-crypto-env-tempTokenExpMinutes";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });

  it("Should fail - Missing mail environment variables", () => {
    envNames.mail.username = "fake-mail-env-username";
    envNames.mail.password = "fake-mail-env-password";
    envNames.mail.userSupport = "fake-mail-env-userSupport";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });

  it("Should fail - Missing UI base url environment variables", () => {
    envNames.uiBaseUrl.dev = "fake-uiBaseUrl-env-dev";
    envNames.uiBaseUrl.prod = "fake-uiBaseUrl-env-prod";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });
});
