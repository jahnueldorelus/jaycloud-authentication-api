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
    envNames.jwt.privateKey = "";
    envNames.jwt.publicKey = "";
    envNames.jwt.refreshExpDays = "";
    envNames.jwt.refreshReqHeader = "";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });

  it("Should fail - Missing access control environment variables", () => {
    envNames.origins.domain = "";
    envNames.origins.local = "";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });

  it("Should fail - Missing crypto environment variables", () => {
    envNames.crypto.key = "";
    envNames.crypto.tempTokenExpMinutes = "";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });

  it("Should fail - Missing mail environment variables", () => {
    envNames.mail.username = "";
    envNames.mail.password = "";
    envNames.mail.userSupport = "";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });

  it("Should fail - Missing UI base url environment variables", () => {
    envNames.uiBaseUrl.dev = "";
    envNames.uiBaseUrl.prod = "";

    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });
});
