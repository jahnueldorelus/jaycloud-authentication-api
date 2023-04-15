import { Request as ExpressRequest } from "express";
import { redirectToUiAuth } from "@controller/sso/components/redirect-to-ui-auth";
import { redirectToUiService } from "@controller/sso/components/redirect-to-ui-service";
import { getSSOToken } from "@controller/sso/components/sso-token";
import { getUser } from "@controller/sso/components/get-user";
import { ExpressRequestAndUser } from "@app-types/authorization";
import { getData } from "@controller/sso/components/get-data";

type Controller = {
  redirectToUiAuth: (arg0: ExpressRequest) => Promise<void>;
  redirectToUiService: (arg0: ExpressRequestAndUser) => Promise<void>;
  getSSOToken: (arg0: ExpressRequest) => Promise<void>;
  getUser: (arg0: ExpressRequestAndUser) => void;
  getData: (arg0: ExpressRequestAndUser) => Promise<void>;
};

export const SSOController: Controller = {
  redirectToUiAuth,
  redirectToUiService,
  getSSOToken,
  getUser,
  getData,
};
