import {
  Router,
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import { DataController } from "@controller/data";
import { validateRequestAuthorization } from "@middleware/authorization";

// Express router for data routes
export const dataRouter = Router();

dataRouter.post(
  "/",
  validateRequestAuthorization,
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await DataController.transferRoute(req);
    next();
  }
);
