import { Request as ExpressRequest } from "express";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { db } from "@services/database";
import path from "path";
import { databaseQuery } from "@services/database/queries";

/**
 * Retrieves the logo of a service.
 * @param req The express request
 * @param serviceId The id of the service whose logo to retrieve
 */
export async function getServiceLogo(
  req: ExpressRequest,
  serviceId: number
): Promise<void> {
  const result = await db.service.getOneService(serviceId);

  if (databaseQuery.isFailedQueryResult(result)) {
    if (result.message === "invalid-service-id") {
      RequestError(
        req,
        Error(
          `Failed to retrieve logo. The service ID provided, "${serviceId}" doesn't exist`
        )
      ).badRequest();
    } else {
      RequestError(
        req,
        Error("Failed to retrieve the service's logo")
      ).server();
    }
  } else {
    const pathToServiceLogo = path.resolve(
      `./src/assets/images/${result.logoFilename}`
    );
    RequestSuccess(req, undefined, undefined, pathToServiceLogo);
  }
}
