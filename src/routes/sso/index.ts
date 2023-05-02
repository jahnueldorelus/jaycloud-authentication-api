import {
  Router,
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import { SSOController } from "@controller/sso";
import {
  validateRequestAuthorization,
  validateSSOReqAuthorization,
} from "@middleware/authorization";
import { ExpressRequestAndUser } from "@app-types/authorization";

// Express router for sso routes
export const ssoRouter = Router();

// Redirects initial auth request from service UI to auth UI.
ssoRouter.post(
  "/sso",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await SSOController.redirectToUiAuth(req);
    next();
  }
);

// Redirects initial auth request from auth UI to service UI.
ssoRouter.post(
  "/sso-redirect",
  validateRequestAuthorization,
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await SSOController.redirectToUiService(<ExpressRequestAndUser>req);
    next();
  }
);

// Retrieves a CSRF token
ssoRouter.get(
  "/sso-token",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await SSOController.getSSOToken(req);
    next();
  }
);

// Signs out the user
ssoRouter.post(
  "/sign-out",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await SSOController.signOutUser(<ExpressRequestAndUser>req);
    next();
  }
);

// Redirects a service to the authentication ui to sign out
ssoRouter.post(
  "/sign-out-auth-redirect",
  validateSSOReqAuthorization,
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await SSOController.signOutAuthRedirect(<ExpressRequestAndUser>req);
    next();
  }
);

// Redirects a signed out user back to the previous service they were using (if one exists)
ssoRouter.post(
  "/sign-out-service-redirect",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await SSOController.redirectSignedOutUser(<ExpressRequestAndUser>req);
    next();
  }
);

// Retrieves the user's data
ssoRouter.post(
  "/sso-user",
  validateSSOReqAuthorization,
  (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    SSOController.getUser(<ExpressRequestAndUser>req);
    next();
  }
);

// Retrieves data from a JayCloud service API
ssoRouter.post(
  "/sso-data",
  validateSSOReqAuthorization,
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await SSOController.getData(<ExpressRequestAndUser>req);
    next();
  }
);
