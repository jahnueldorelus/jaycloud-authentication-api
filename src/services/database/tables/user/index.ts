import { Pool } from "mysql2/promise";

export class User {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }
}
