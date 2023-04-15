import dotenv from "dotenv";

export type CheckConfigReturn = {
  configComplete: boolean;
  error: string | null;
};

export const envNames = {
  nodeEnv: "NODE_ENV",
  db: {
    name: "DATABASE_NAME",
    host: "DATABASE_HOST",
    user: "DATABASE_USERNAME",
    password: "DATABASE_PASSWORD",
  },
  jwt: {
    alg: "JWT_ALGORITHM",
    privateKey: "JWT_PRIVATE_KEY",
    publicKey: "JWT_PUBLIC_KEY",
    accessExpiration: "JWT_ACC_EXP",
    accessReqHeader: "JWT_ACC_REQ_HEADER",
    refreshExpDays: "JWT_REF_EXP_DAYS",
    refreshReqHeader: "JWT_REF_REQ_HEADER",
  },
  crypto: {
    key: "CRYPTO_KEY",
    tempTokenExpMinutes: "CRYPTO_TEMP_TOKEN_EXP_MINUTES",
  },
  origins: {
    local: "ORIGIN_LOCAL_HOST_ADDR",
    lan: "ORIGIN_LAN_ADDR",
    wanDev: "ORIGIN_WAN_DEV_ADDR",
    wanProd: "ORIGIN_WAN_PROD_ADDR",
    apiProd: "ORIGIN_PROD_API",
    apiDev: "ORIGIN_DEV_API",
    domain: "ORIGIN_DOMAIN",
  },
  mail: {
    username: "EMAIL_USERNAME",
    password: "EMAIL_PASSWORD",
    userSupport: "EMAIL_USER_SUPPORT",
  },
  uiBaseUrl: {
    dev: "UI_BASE_URL_DEV",
    prod: "UI_BASE_URL_PROD",
  },
  cookie: {
    initialAuthReq: "COOKIE_INIT_AUTH_REQ",
    ssoId: "COOKIE_SSO_ID",
    serviceUrl: "COOKIE_SERVICE_URL",
    serviceDomain: "COOKIE_SERVICE_DOMAIN",
    key: "COOKIE_KEY",
  },
};

/**
 * Checks if all config properties are available before starting the server
 */
export default (): CheckConfigReturn => {
  dotenv.config();

  const errorNames: string[] = [];

  // Checks database configuration
  if (!process.env[envNames.db.name]) {
    errorNames.push(envNames.db.name);
  }
  if (!process.env[envNames.db.host]) {
    errorNames.push(envNames.db.host);
  }
  if (!process.env[envNames.db.user]) {
    errorNames.push(envNames.db.user);
  }
  if (!process.env[envNames.db.password]) {
    errorNames.push(envNames.db.password);
  }
  // Checks JSON Web Token configuration
  if (!process.env[envNames.jwt.alg]) {
    errorNames.push(envNames.jwt.alg);
  }
  if (!process.env[envNames.jwt.privateKey]) {
    errorNames.push(envNames.jwt.privateKey);
  }
  if (!process.env[envNames.jwt.publicKey]) {
    errorNames.push(envNames.jwt.publicKey);
  }
  if (!process.env[envNames.jwt.accessReqHeader]) {
    errorNames.push(envNames.jwt.accessReqHeader);
  }
  if (!process.env[envNames.jwt.refreshReqHeader]) {
    errorNames.push(envNames.jwt.refreshReqHeader);
  }
  if (!process.env[envNames.jwt.accessExpiration]) {
    errorNames.push(envNames.jwt.accessExpiration);
  }
  if (!process.env[envNames.jwt.refreshExpDays]) {
    errorNames.push(envNames.jwt.refreshExpDays);
  }
  // Checks Crypto configuration
  if (!process.env[envNames.crypto.key]) {
    errorNames.push(envNames.crypto.key);
  }
  if (!process.env[envNames.crypto.tempTokenExpMinutes]) {
    errorNames.push(envNames.crypto.tempTokenExpMinutes);
  }
  // Checks Access-Control for CORS configuration
  if (!process.env[envNames.origins.local]) {
    errorNames.push(envNames.origins.local);
  }
  if (!process.env[envNames.origins.lan]) {
    errorNames.push(envNames.origins.lan);
  }
  if (!process.env[envNames.origins.wanDev]) {
    errorNames.push(envNames.origins.wanDev);
  }
  if (!process.env[envNames.origins.wanProd]) {
    errorNames.push(envNames.origins.wanProd);
  }
  if (!process.env[envNames.origins.apiDev]) {
    errorNames.push(envNames.origins.apiDev);
  }
  if (!process.env[envNames.origins.apiProd]) {
    errorNames.push(envNames.origins.apiProd);
  }
  if (!process.env[envNames.origins.domain]) {
    errorNames.push(envNames.origins.domain);
  }
  // Checks email configuration
  if (!process.env[envNames.mail.password]) {
    errorNames.push(envNames.mail.password);
  }
  if (!process.env[envNames.mail.userSupport]) {
    errorNames.push(envNames.mail.userSupport);
  }
  if (!process.env[envNames.mail.username]) {
    errorNames.push(envNames.mail.username);
  }
  // Checks cookie configuration
  if (!process.env[envNames.cookie.initialAuthReq]) {
    errorNames.push(envNames.cookie.initialAuthReq);
  }
  if (!process.env[envNames.cookie.ssoId]) {
    errorNames.push(envNames.cookie.ssoId);
  }
  if (!process.env[envNames.cookie.serviceUrl]) {
    errorNames.push(envNames.cookie.serviceUrl);
  }
  if (!process.env[envNames.cookie.serviceDomain]) {
    errorNames.push(envNames.cookie.serviceDomain);
  }
  if (!process.env[envNames.cookie.key]) {
    errorNames.push(envNames.cookie.key);
  }
  return {
    configComplete: errorNames.length > 0 ? false : true,
    error:
      errorNames.length > 0
        ? `Can't start the server. The environment variables listed below are not defined.\n${errorNames
            .map((name) => `\x1b[91m${name}\x1b[0m`)
            .join(", ")}`
        : null,
  };
};
