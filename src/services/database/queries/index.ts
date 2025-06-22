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

  /**
   * Creates a failed query result.
   * @param errorMessage The error message
   * @param data The data to send along with the message
   * @returns An object containing an error message and any data associated with it
   */
  public createFailedQuery<
    T extends string,
    K extends number | string | boolean | null
  >(errorMessage: T, data: K): FailedQueryResult<T, K> {
    return Object.freeze({ message: errorMessage, data });
  }

  /**
   * Determines if an object is a failed query result.
   * @param obj The object to test
   * @returns A boolean determining if the object is a failed query result
   */
  public isFailedQueryResult(
    obj: any
  ): obj is ReturnType<typeof this.createFailedQuery> {
    const givenObject = <ReturnType<typeof this.createFailedQuery>>obj;

    return Boolean(
      givenObject.message && (!!givenObject.data || givenObject.data === null)
    );
  }

  /**
   * Determines if an error is a database query error.
   * @returns A boolean determining if the error is a database query error
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
