import { FieldPacket, RowDataPacket } from "mysql2";

export type QueryResult = [RowDataPacket[], FieldPacket[]];

export type QueryError = {
  code: string;
  errno: number;
  sql: string;
  sqlState: string;
  sqlMessage: string;
};

export type FailedQueryResult<T, K> = {
  message: T;
  data: K;
};

type MysqlErrorNames = "duplicateEntry" | "signalException";

export type MysqlQueryErrors = Record<
  MysqlErrorNames,
  {
    errorNumber: MysqlErrorNumbers;
    errorCode: MysqlErrorCodes;
  }
>;

export type MysqlErrorNumbers = 1062 | 1644;
export type MysqlErrorCodes = "ER_DUP_ENTRY" | "ER_SIGNAL_EXCEPTION";
