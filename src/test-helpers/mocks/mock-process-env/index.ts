import { envNames } from "@startup/config";
import { CustomEnvVariablesValues } from "./types";

/**
 * Sets the default mock values for all environmental variables. If a custom
 * value for an environmental variable is provided, that value is used instead.
 * @param customValues An object containing custom values to set for the environment variables
 */
export function setMockEnvironmentVariables(
  customValues?: CustomEnvVariablesValues,
): void {
  // Cookies variables
  process.env[envNames.cookie.initialAuthReq] =
    customValues?.cookie?.initialAuthReq || "mock-cookie-req";
  process.env[envNames.cookie.key] =
    customValues?.cookie?.key || "mock-cookie-key";
  process.env[envNames.cookie.serviceDomain] =
    customValues?.cookie?.serviceDomain || "mock-cookie-service-domain";
  process.env[envNames.cookie.serviceUrl] =
    customValues?.cookie?.serviceUrl || "https://mock.cookie-service-url.com";
  process.env[envNames.cookie.ssoId] =
    customValues?.cookie?.ssoId || "mock-cookie-sso-id";

  // Crypto variables
  process.env[envNames.crypto.key] =
    customValues?.crypto?.key || "mock-crypto-key";
  process.env[envNames.crypto.tempTokenExpMinutes] =
    customValues?.crypto?.tempTokenExpMinutes || "10";

  // JSON web token variables
  process.env[envNames.jwt.accessExpiration] =
    customValues?.jwt?.accessExpiration || "1h";
  process.env[envNames.jwt.accessReqHeader] =
    customValues?.jwt?.accessReqHeader || "mock-access-req-header";
  process.env[envNames.jwt.alg] = customValues?.jwt?.alg || "HS256";
  process.env[envNames.jwt.privateKey] =
    customValues?.jwt?.privateKey || "mock-jwt-key";
  process.env[envNames.jwt.publicKey] =
    customValues?.jwt?.publicKey || "mock-jwt-key";
  process.env[envNames.jwt.refreshExpDays] =
    customValues?.jwt?.refreshExpDays || "7";
  process.env[envNames.jwt.refreshReqHeader] =
    customValues?.jwt?.refreshReqHeader || "mock-refresh-req-header";

  // Mailing server variables
  process.env[envNames.mail.password] =
    customValues?.mail?.password || "mock-mail-service-password";
  process.env[envNames.mail.userSupport] =
    customValues?.mail?.userSupport || "mock-mail-support-email@gmail.com";
  process.env[envNames.mail.username] =
    customValues?.mail?.username || "mock-mail-service-username";

  // Database server variables
  process.env[envNames.db.name] =
    customValues?.db?.name || "mock-database-name";
  process.env[envNames.db.host] =
    customValues?.db?.host || "mock-database-host";
  process.env[envNames.db.password] =
    customValues?.db?.password || "mock-database-password";
  process.env[envNames.db.user] =
    customValues?.db?.user || "mock-database-user";

  // Node variables
  process.env[envNames.nodeEnv] = customValues?.nodeEnv || "production";

  // API accepted origins variables
  process.env[envNames.origins.apiDev] =
    customValues?.origins?.apiDev || "https://dev-api.mockservice.com";
  process.env[envNames.origins.apiProd] =
    customValues?.origins?.apiProd || "https://prod-api.mockservice.com";
  process.env[envNames.origins.domain] =
    customValues?.origins?.domain || "mockservice.com";
  process.env[envNames.origins.local] =
    customValues?.origins?.local || "localhost";
  process.env[envNames.origins.wanDev] =
    customValues?.origins?.wanDev || "https://dev-ui.mockservice.com";
  process.env[envNames.origins.wanProd] =
    customValues?.origins?.wanProd || "https://prod-ui.mockservice.com";

  // API accepted UI origin base URL variables
  process.env[envNames.uiBaseUrl.dev] =
    customValues?.uiBaseUrl?.dev || "https://dev-ui.mockservice.com";
  process.env[envNames.uiBaseUrl.prod] =
    customValues?.uiBaseUrl?.prod || "https://prod-ui.mockservice.com";
}
