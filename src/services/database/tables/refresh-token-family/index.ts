import { Pool } from "mysql2/promise";

export class RefreshTokenFamily {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }
}
