import { connection } from "mongoose";
import { usersModel } from "./models/users";
import { refreshTokensModel } from "./models/refresh-tokens";
import { refreshTokenFamiliesModel } from "./models/refresh-token-families";
import { approvedPasswordResetModel } from "./models/approved-password-reset";
import { servicesModel } from "./models/services";
import { ssoModel } from "./models/sso";
import { envNames } from "@startup/config";
import { Pool, createPool as mysqlCreatePool } from "mysql2/promise";
import { User } from "./tables/user";
import { RefreshTokenFamily } from "./tables/refresh-token-family";
import { RefreshToken } from "./tables/refresh-token";
import { SsoToken } from "./tables/sso-token";
import { Service } from "./tables/service";
// import { ApprovedPasswordReset } from "./tables/approved-password-reset";
// import { RefreshToken } from "./tables/refresh-token";
// import { RefreshTokenFamily } from "./tables/refresh-token-family";
// import { SSO } from "./tables/sso";
// import { Service } from "./tables/service";

const connectToDatabase = () => {
  // connect(process.env[envNames.db.host] || "", {
  //   dbName: process.env[envNames.db.name],
  //   authSource: process.env[envNames.db.name],
  //   auth: {
  //     username: process.env[envNames.db.user],
  //     password: process.env[envNames.db.password],
  //   },
  //   authMechanism: "DEFAULT",
  //   directConnection: true,
  //   tls: true,
  //   tlsAllowInvalidCertificates: true,
  // });

  connection.once("open", () =>
    console.log("Connected to MongoDB successfully")
  );

  return {
    usersModel,
    refreshTokensModel,
    refreshTokenFamiliesModel,
    approvedPasswordResetModel,
    servicesModel,
    ssoModel,
  };
};

export const dbAuth = connectToDatabase();

class MysqlDatabase {
  private readonly host?: string;
  private readonly username?: string;
  private readonly password?: string;
  private readonly databaseName?: string;
  private readonly pool: Pool;

  public readonly user: User;
  // public readonly approvedPasswordReset: ApprovedPasswordReset;
  public readonly refreshToken: RefreshToken;
  public readonly refreshTokenFamily: RefreshTokenFamily;
  public readonly ssoToken: SsoToken;
  public readonly service: Service;

  constructor() {
    this.host = process.env[envNames.mysql.host];
    this.username = process.env[envNames.mysql.user];
    this.password = process.env[envNames.mysql.password];
    this.databaseName = process.env[envNames.mysql.databaseName];
    this.pool = this.createPool();
    this.pool.on("connection", (stream) =>
      console.log(
        "Added successfull connection to MySQL database - ID #" +
          stream.threadId
      )
    );

    this.user = new User(this.pool);
    // this.approvedPasswordReset = new ApprovedPasswordReset(this.pool);
    this.refreshToken = new RefreshToken(this.pool);
    this.refreshTokenFamily = new RefreshTokenFamily(this.pool);
    this.ssoToken = new SsoToken(this.pool);
    this.service = new Service(this.pool);
  }

  /**
   * Creates a database pool for managing connections.
   */
  private createPool(): Pool {
    const pool = mysqlCreatePool({
      host: this.host,
      user: this.username,
      password: this.password,
      database: this.databaseName,
      port: 3306,
      decimalNumbers: true,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    return pool;
  }
}

export const db = new MysqlDatabase();
