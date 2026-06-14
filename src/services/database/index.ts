import { envNames } from "@startup/config";
import { Pool, createPool as mysqlCreatePool } from "mysql2/promise";
import { User } from "./tables/user";
import { RefreshTokenFamily } from "./tables/refresh-token-family";
import { RefreshToken } from "./tables/refresh-token";
import { SsoToken } from "./tables/sso-token";
import { Service } from "./tables/service";
import { ApprovedPasswordReset } from "./tables/approved-password-reset";

class MysqlDatabase {
  private readonly host?: string;
  private readonly username?: string;
  private readonly password?: string;
  private readonly databaseName?: string;
  private readonly pool: Pool;

  public readonly user: User;
  public readonly refreshToken: RefreshToken;
  public readonly refreshTokenFamily: RefreshTokenFamily;
  public readonly ssoToken: SsoToken;
  public readonly service: Service;
  public readonly approvedPasswordReset: ApprovedPasswordReset;

  constructor() {
    this.host = process.env[envNames.db.host];
    this.username = process.env[envNames.db.user];
    this.password = process.env[envNames.db.password];
    this.databaseName = process.env[envNames.db.name];
    this.pool = this.createPool();
    this.pool.on("connection", (stream) =>
      console.log(
        "Added successfull connection to database - ID #" + stream.threadId,
      ),
    );

    this.user = new User(this.pool);
    this.refreshToken = new RefreshToken(this.pool);
    this.refreshTokenFamily = new RefreshTokenFamily(this.pool);
    this.ssoToken = new SsoToken(this.pool);
    this.service = new Service(this.pool);
    this.approvedPasswordReset = new ApprovedPasswordReset(this.pool);
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
