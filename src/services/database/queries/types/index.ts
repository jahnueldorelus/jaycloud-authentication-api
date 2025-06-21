import { FieldPacket, QueryResult as MysqlQueryResult } from "mysql2";

export type QueryResult = [MysqlQueryResult, FieldPacket[]];

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
