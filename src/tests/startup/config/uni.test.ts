import checkConfig from "@startup/config";
import { envNames } from "@startup/config";

describe("Startup - Configuration", () => {
  it("Should pass - No missing environment variables", () => {
    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(true);
    expect(error).toBeNull();
  });

  it("Should fail - Missing environment variables", () => {
    envNames.cryptoKey = "";
    const { configComplete, error } = checkConfig();

    expect(configComplete).toBe(false);
    expect(error).toBeTruthy();
  });
});
