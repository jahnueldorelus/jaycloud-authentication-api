import dotenv from "dotenv";

export type CheckConfigReturn = {
  configComplete: boolean;
  error: string | null;
};

/**
 * Checks if all config properties are available before starting the server
 */
export default (): CheckConfigReturn => {
  dotenv.config();

  let errorNames: string[] = [];

  // Checks database configuration
  if (!process.env["DATABASE_NAME"]) errorNames.push("DATABASE_NAME");
  if (!process.env["DATABASE_HOST"]) errorNames.push("DATABASE_HOST");
  if (!process.env["DATABASE_USERNAME"]) errorNames.push("DATABASE_USERNAME");
  if (!process.env["DATABASE_PASSWORD"]) errorNames.push("DATABASE_PASSWORD");
  // Checks JSON Web Token configuration
  if (!process.env["JWT_ALGORITHM"]) errorNames.push("JWT_ALGORITHM");
  if (!process.env["JWT_KEY"]) errorNames.push("JWT_KEY");
  if (!process.env["JWT_ACC_REQ_HEADER"]) errorNames.push("JWT_ACC_REQ_HEADER");
  if (!process.env["JWT_REF_REQ_HEADER"]) errorNames.push("JWT_REF_REQ_HEADER");
  if (!process.env["JWT_ACC_EXP"]) errorNames.push("JWT_ACC_EXP");
  if (!process.env["JWT_REF_EXP"]) errorNames.push("JWT_REF_EXP");
  // Checks Crypto configuration
  if (!process.env["CRYPTO_KEY"]) errorNames.push("CRYPTO_KEY");
  // Checks Access-Control for CORS configuration
  if (!process.env["ORIGIN_LOCAL_HOST_ADDR"])
    errorNames.push("ORIGIN_LOCAL_HOST_ADDR");
  if (!process.env["ORIGIN_LAN_ADDR"]) errorNames.push("ORIGIN_LAN_ADDR");

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
