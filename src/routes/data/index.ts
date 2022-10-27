import {
  Router,
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import { DataController } from "@controller/data";

// Express router for data routes
export const dataRouter = Router();

dataRouter.all(
  "/",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await DataController.transferRoute(req);
    next();
  }
);
