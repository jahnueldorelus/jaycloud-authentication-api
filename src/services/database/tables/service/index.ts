import { Pool } from "mysql2/promise";

export class Service {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    console.log(this.pool.config.host);
  }
}
