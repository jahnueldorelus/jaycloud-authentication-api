import checkConfig from "@startup/config";
import { envNames } from "@startup/config";

describe("Startup - Configuration", () => {
  it("Should pass - No missing environment variables", () => {
    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(true);
    expect(error).toBeNull();
  });

  it("Should fail - Missing database environment variables", () => {
    envNames.db.host = "";
    envNames.db.name = "";
    envNames.db.password = "";
    envNames.db.user = "";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });

  it("Should fail - Missing JWT environment variables", () => {
    envNames.jwt.accessExpiration = "";
    envNames.jwt.accessReqHeader = "";
    envNames.jwt.alg = "";
    envNames.jwt.key = "";
    envNames.jwt.refreshExpiration = "";
    envNames.jwt.refreshReqHeader = "";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });

  it("Should fail - Missing encryption environment variables", () => {
    envNames.origins.lan = "";
    envNames.origins.local = "";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });

  it("Should fail - Missing access control environment variables", () => {
    envNames.cryptoKey = "";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });
});
