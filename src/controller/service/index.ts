import { Request as ExpressRequest } from "express";
import { getServices } from "./components/services-list";
import { getServiceLogo } from "./components/service-logo";

type Controller = {
  getServices: (arg0: ExpressRequest) => Promise<void>;
  getServiceLogo: (arg0: ExpressRequest, arg1: string) => Promise<void>;
};

export const ServiceController: Controller = {
  getServices,
  getServiceLogo,
};
