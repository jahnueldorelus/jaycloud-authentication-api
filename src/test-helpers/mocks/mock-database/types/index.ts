/**
 * The parameter type T is expected to be the same type as
 * the real database object.
 *
 * This type as a whole ensures that for the mock database object,
 * every key that represents a database table has a value of an
 * object containing their respective functions as mocks.
 *
 * In other words, every database function will be a spy instance.
 *    db.tableA.tableAFunction = jest.SpyInstance
 *    db.tableB.tableBFunction = jest.SpyInstance
 * ...and so on.
 */
export type MockDatabase<T> = {
  [A in keyof T]: {
    [B in keyof T[A]]: jest.SpyInstance;
  };
};
