import { databaseQuery } from "@services/database/queries";
import { FailedQueryResult } from "@services/database/queries/types";
import { LoadedService } from "@services/database/table-models/loaded-service";
import { Pool } from "mysql2/promise";
import { DatabaseService } from "./types";

export class Service {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Attempts to retrieve the list of services.
   * @returns The list of services or a failed query request
   */
  public async getListOfServices(): Promise<
    LoadedService[] | FailedQueryResult<"server-error", null>
  > {
    try {
      const listOfServices = databaseQuery.getManyQueryData<DatabaseService>(
        await this.pool.execute("SELECT * FROM JayCloudService")
      );

      if (!listOfServices) {
        throw Error();
      }

      return listOfServices.map(
        (databaseService) => new LoadedService(databaseService)
      );
    } catch (error) {
      return databaseQuery.createFailedQuery("server-error", null);
    }
  }

  /**
   * Attempts to retrieve a single service's information.
   * @param id The id of the service
   * @returns The service's info or a failed query request
   */
  public async getOneService(
    id: number
  ): Promise<
    | LoadedService
    | FailedQueryResult<"server-error" | "invalid-service-id", null>
  > {
    try {
      const serviceData = databaseQuery.getOneQueryData<DatabaseService>(
        await this.pool.execute("SELECT * FROM JayCloudService WHERE ID = ?", [
          id,
        ])
      );

      if (!serviceData) {
        return databaseQuery.createFailedQuery("invalid-service-id", null);
      } else {
        return new LoadedService(serviceData);
      }
    } catch (error) {
      return databaseQuery.createFailedQuery("server-error", null);
    }
  }
}
