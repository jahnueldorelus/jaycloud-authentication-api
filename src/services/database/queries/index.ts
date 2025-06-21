import { FailedQueryResult, QueryError, QueryResult } from "./types";

class DatabaseQuery {
  /**
   * Retrieves a single piece of data from a database query.
   * @param queryResult The result of a database query
   * @returns A single item from a database query or null
   */
  public getOneQueryData<T>(queryResult: QueryResult): T | null {
    const dataList = <T[]>queryResult[0];

    return dataList.length === 1 ? <T>dataList[0] : null;
  }

  /**
   * Retrieves a list of data from a database query.
   * @param queryResult The result of a database query
   * @returns A list of items from a database query or null
   */
  public getManyQueryData<T>(queryResult: QueryResult): T | null {
    const dataList = <T[]>queryResult[0];

    return dataList.length === 1 ? <T>dataList : null;
  }

  public createFailedQuery<
    T extends string,
    K extends number | string | boolean | null
  >(message: T, data: K): FailedQueryResult<T, K> {
    return Object.freeze({ message, data });
  }

  /**
   * Determines if an error is a database query error.
   */
  public isQueryError(error: unknown): error is QueryError {
    const queryError = <QueryError>error;

    if (
      queryError.code &&
      queryError.sql &&
      queryError.sqlMessage &&
      queryError.sqlState
    ) {
      return true;
    } else {
      return false;
    }
  }
}

export const databaseQuery = new DatabaseQuery();
