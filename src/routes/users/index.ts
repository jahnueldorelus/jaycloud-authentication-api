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
    await UserController.createNewRefreshToken(req);
    next();
  }
);

// Retrieves the form model to create a new user
userRouter.get("/form-models", async (req, res, next) => {
  await UserController.getNewUserFormModel(req);
  next();
});

// Resets the user's password
userRouter.post(
  "/password-reset",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await UserController.resetPassword(req);
    next();
  }
);

// Verifies the user's temp token
userRouter.post(
  "/verify-temp-token",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await UserController.verifyTempToken(req);
    next();
  }
);

// // Resets the user's password
// userRouter.post(
//   "/update-password",
//   async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
//     await UserController.updatePassword(req);
//     next();
//   }
// );
