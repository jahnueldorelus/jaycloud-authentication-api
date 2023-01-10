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
    key: "JWT_KEY",
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
    wanProd: "ORIGIN_WAN_DV_ADDR",
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
  if (!process.env[envNames.jwt.key]) {
    errorNames.push(envNames.jwt.key);
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
