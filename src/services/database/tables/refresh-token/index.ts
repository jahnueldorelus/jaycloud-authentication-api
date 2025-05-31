import { Pool } from "mysql2/promise";

export class RefreshToken {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }
}
