import { Request as ExpressRequest } from "express";
import { redirectToUiAuth } from "./components/redirect-to-ui-auth";
import { redirectToUiService } from "./components/redirect-to-ui-service";
import { getSSOToken } from "./components/sso-token";
import { ExpressRequestAndUser } from "@app-types/authorization";

type Controller = {
  redirectToUiAuth: (arg0: ExpressRequest) => Promise<void>;
  redirectToUiService: (arg0: ExpressRequestAndUser) => Promise<void>;
  getSSOToken: (arg0: ExpressRequest) => Promise<void>;
};

export const SSOController: Controller = {
  redirectToUiAuth,
  redirectToUiService,
  getSSOToken,
};
