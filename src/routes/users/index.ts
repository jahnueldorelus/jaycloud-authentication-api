import {
  Router,
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import { UserController } from "@controller/user";

// Express router for user routes
export const userRouter = Router();
const formModelRouter = Router();

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
  "/refresh-token",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await UserController.createNewRefreshToken(req);
    next();
  }
);

// Resets the user's password
userRouter.post(
  "/password-reset",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await UserController.resetPassword(req);
    next();
  }
);

// Resets the user's password
userRouter.post(
  "/update-password",
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    await UserController.updatePassword(req);
    next();
  }
);

userRouter.use("/form-models", formModelRouter);

// Retrieves the form model to create a new user
formModelRouter.get("/create-user", async (req, res, next) => {
  await UserController.getNewUserFormModel(req);
  next();
});

// Retrieves the form model to update a new user
formModelRouter.get("/update-user", async (req, res, next) => {
  await UserController.getUpdateUserFormModel(req);
  next();
});

// Retrieves the form model to authenticate a new user
formModelRouter.get("/authenticate-user", async (req, res, next) => {
  await UserController.getAuthenticateUserFormModel(req);
  next();
});

// Retrieves the form model to reset a user's password
formModelRouter.get("/password-reset", async (req, res, next) => {
  await UserController.getPasswordResetFormModel(req);
  next();
});

// Retrieves the form model to update a user's password
formModelRouter.get("/update-password", async (req, res, next) => {
  await UserController.getUpdatePasswordFormModel(req);
  next();
});
