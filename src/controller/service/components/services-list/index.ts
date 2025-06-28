import { Request as ExpressRequest } from "express";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { db } from "@services/database";
import { databaseQuery } from "@services/database/queries";

/**
 * Retrieves the list of application services from the database.
 * @param req The express request
 */
export async function getServices(req: ExpressRequest) {
  const listOfServices = await db.service.getListOfServices();

  if (databaseQuery.isFailedQueryResult(listOfServices)) {
    RequestError(
      req,
      Error("Failed to retrieve the list of services")
    ).server();
  } else {
    RequestSuccess(
      req,
      listOfServices.map((service) => service.getPublicInfoJson())
    );
  }
}
