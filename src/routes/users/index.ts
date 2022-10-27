import {
  Router,
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import { UserController } from "@controller/user";

// Express router for user routes
export const userRouter = Router();

// Creates a new user account
userRouter.post(
  "/new",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await UserController.createNewUser(req);
    next();
  }
);

// Authenticates a user
userRouter.post(
  "/",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await UserController.authenticateUser(req);
    next();
  }
);

// Creates a new refresh token for a user
userRouter.post(
  "/refreshToken",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await UserController.refreshAccessToken(req);
    next();
  }
);

// Retrieves the form model to create a new user
userRouter.get("/form-models", async (req, res, next) => {
  await UserController.getFormModels(req);
  next();
});
