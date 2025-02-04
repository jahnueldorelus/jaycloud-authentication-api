import { Request as ExpressRequest } from "express";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { connection } from "mongoose";
import { dbAuth } from "@services/database";

export const getServices = async (req: ExpressRequest) => {
  const dbSession = await connection.startSession();
  try {
    dbSession.startTransaction();

    const servicesList = await dbAuth.servicesModel.find(
      {},
      { prodApiUrl: 0, devApiUrl: 0 },
      {
        session: dbSession,
      }
    );

    await dbSession.commitTransaction();

    const modifiedServicesList = servicesList.map((service) =>
      service.toPrivateJSON()
    );

    RequestSuccess(req, modifiedServicesList);
  } catch (error: any) {
    if (dbSession.inTransaction()) {
      await dbSession.abortTransaction();
    }

    RequestError(
      req,
      Error("Failed to retrieve the list of services")
    ).server();
  } finally {
    await dbSession.endSession();
  }
};
