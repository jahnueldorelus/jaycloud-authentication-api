import {
  Router,
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import { ServiceController } from "@controller/service";

// Express router for data routes
export const servicesRouter = Router();

// Retrieves the list of services
servicesRouter.get(
  "/",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await ServiceController.getServices(req);
    next();
  }
);

// Retrieves the logo of a service
servicesRouter.get(
  "/logo/:serviceId",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    const serviceId = <string>req.params["serviceId"];
    await ServiceController.getServiceLogo(req, serviceId);
    next();
  }
);
