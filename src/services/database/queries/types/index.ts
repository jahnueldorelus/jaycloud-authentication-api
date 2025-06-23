import { FieldPacket, RowDataPacket } from "mysql2";

export type QueryResult = [RowDataPacket[], FieldPacket[]];

export type QueryError = {
  code: string;
  sql: string;
  sqlState: number;
  sqlMessage: string;
};

export type FailedQueryResult<T, K> = {
  message: T;
  data: K;
};
