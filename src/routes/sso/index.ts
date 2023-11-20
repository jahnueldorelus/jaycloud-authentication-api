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

// Redirects a service to the authentication ui to sign in.
ssoRouter.post(
  "/sign-in-auth-redirect",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await SSOController.redirectToAuthUi(req);
    next();
  }
);

// Redirects a signed in user back to the previous service where they requested to sign in
ssoRouter.post(
  "/sign-in-service-redirect",
  validateRequestAuthorization,
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await SSOController.redirectToServiceUi(<ExpressRequestAndUser>req);
    next();
  }
);

// Retrieves a user's decrypted CSRF token
ssoRouter.get(
  "/sso-token",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await SSOController.getSSOToken(req);
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

// Redirects a signed out user back to the previous service where they requested to sign out
ssoRouter.post(
  "/sign-out-service-redirect",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await SSOController.redirectSignedOutUser(<ExpressRequestAndUser>req);
    next();
  }
);

// Retrieves specialized data of the user for services using SSO
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
