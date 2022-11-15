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
    refreshExpiration: "JWT_REF_EXP_SECONDS",
    refreshReqHeader: "JWT_REF_REQ_HEADER",
  },
  cryptoKey: "CRYPTO_KEY",
  origins: {
    local: "ORIGIN_LOCAL_HOST_ADDR",
    lan: "ORIGIN_LAN_ADDR",
  },
};

/**
 * Checks if all config properties are available before starting the server
 */
export default (): CheckConfigReturn => {
  dotenv.config();

  let errorNames: string[] = [];

  // Checks database configuration
  if (!process.env[envNames.db.name]) errorNames.push(envNames.db.name);
  if (!process.env[envNames.db.host]) errorNames.push(envNames.db.host);
  if (!process.env[envNames.db.user]) errorNames.push(envNames.db.user);
  if (!process.env[envNames.db.password]) errorNames.push(envNames.db.password);
  // Checks JSON Web Token configuration
  if (!process.env[envNames.jwt.alg]) errorNames.push(envNames.jwt.alg);
  if (!process.env[envNames.jwt.key]) errorNames.push(envNames.jwt.key);
  if (!process.env[envNames.jwt.accessReqHeader])
    errorNames.push(envNames.jwt.accessReqHeader);
  if (!process.env[envNames.jwt.refreshReqHeader])
    errorNames.push(envNames.jwt.refreshReqHeader);
  if (!process.env[envNames.jwt.accessExpiration])
    errorNames.push(envNames.jwt.accessExpiration);
  if (!process.env[envNames.jwt.refreshExpiration])
    errorNames.push(envNames.jwt.refreshExpiration);
  // Checks Crypto configuration
  if (!process.env[envNames.cryptoKey]) errorNames.push(envNames.cryptoKey);
  // Checks Access-Control for CORS configuration
  if (!process.env[envNames.origins.local])
    errorNames.push(envNames.origins.local);
  if (!process.env[envNames.origins.lan]) errorNames.push(envNames.origins.lan);

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
