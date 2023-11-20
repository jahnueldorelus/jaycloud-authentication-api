import { Request as ExpressRequest } from "express";
import { redirectToAuthUi } from "@controller/sso/components/redirect-to-ui-auth";
import { redirectToServiceUi } from "@controller/sso/components/redirect-to-ui-service";
import { getSSOToken } from "@controller/sso/components/sso-token";
import { getUser } from "@controller/sso/components/get-user";
import { ExpressRequestAndUser } from "@app-types/authorization";
import { getUserId } from "@controller/sso/components/get-user-id";
import { signOutAuthRedirect } from "@controller/sso/components/sign-out-auth-redirect";
import { redirectSignedOutUser } from "@controller/sso/components/redirect-signed-out-user";

type Controller = {
  redirectToAuthUi: (arg0: ExpressRequest) => Promise<void>;
  redirectToServiceUi: (arg0: ExpressRequestAndUser) => Promise<void>;
  getSSOToken: (arg0: ExpressRequest) => Promise<void>;
  getUser: (arg0: ExpressRequestAndUser) => void;
  getUserId: (arg0: ExpressRequestAndUser) => Promise<void>;
  signOutAuthRedirect: (arg0: ExpressRequestAndUser) => Promise<void>;
  redirectSignedOutUser: (arg0: ExpressRequest) => Promise<void>;
};

export const SSOController: Controller = {
  redirectToAuthUi,
  redirectToServiceUi,
  getSSOToken,
  getUser,
  getUserId,
  signOutAuthRedirect,
  redirectSignedOutUser,
};
