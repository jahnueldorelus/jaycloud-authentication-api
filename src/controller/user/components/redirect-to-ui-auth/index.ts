import { RequestSuccess } from "@middleware/request-success";
import { envNames } from "@startup/config";
import { Request as ExpressRequest } from "express";
import { randomUUID } from "crypto";
import { connection } from "mongoose";
import { dbAuth } from "@services/database";
import { ISSO } from "@app-types/database/models/sso";
import moment from "moment";
import { RequestError } from "@middleware/request-error";

export const redirectToUiAuth = async (
  req: ExpressRequest,
  serviceUrl: string | null
) => {
  const dbSession = await connection.startSession();

  const authUrl =
    process.env[envNames.nodeEnv] === "production"
      ? process.env[envNames.origins.wanProd]
      : process.env[envNames.origins.wanDev];

  try {
    dbSession.startTransaction();

    // Initial auth request cookie name
    const authCookieName = <string>process.env[envNames.cookie.initialAuthReq];

    // Initial auth request id from cookie
    const initAuthReqId = req.signedCookies[authCookieName];

    // Removes the old initial auth request if it exists
    if (initAuthReqId) {
      await dbAuth.ssoModel.findOneAndRemove(
        { reqId: initAuthReqId },
        { session: dbSession }
      );
    }

    // Creates a new initial auth request
    const expDate = moment(new Date());
    expDate.add(
      parseInt(<string>process.env[envNames.jwt.refreshExpDays]),
      "days"
    );

    const ssoInfo: Omit<ISSO, "userId"> = {
      expDate: expDate.toDate(),
      reqId: randomUUID(),
      ssoId: randomUUID(),
    };

    const [ssoReq] = await dbAuth.ssoModel.create([ssoInfo], {
      session: dbSession,
    });

    if (!ssoReq) {
      throw Error();
    }

    await dbSession.commitTransaction();

    const reqCookieInfo = {
      expDate: ssoReq.expDate,
      key: authCookieName,
      value: ssoReq.reqId,
    };

    RequestSuccess(
      req,
      {
        authUrl: authUrl + "/login?serviceUrl=" + serviceUrl,
      },
      null,
      null,
      [reqCookieInfo]
    );
  } catch (error: any) {
    if (dbSession.inTransaction()) {
      await dbSession.abortTransaction();
    }

    RequestError(req, Error("Failed to initialize auth request.")).server();
  } finally {
    await dbSession.endSession();
  }
};
