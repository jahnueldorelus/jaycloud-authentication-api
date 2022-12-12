import { Request as ExpressRequest } from "express";
import { createNewUser } from "./components/new-user";
import { authenticateUser } from "./components/authenticate-user";
import { createNewRefreshToken } from "./components/new-refresh-token";
import { getNewUserFormModel } from "./components/new-user-form-model";
import { resetPassword } from "./components/reset-password";

type Controller = {
  createNewUser: (arg0: ExpressRequest) => Promise<void>;
  authenticateUser: (arg0: ExpressRequest) => Promise<void>;
  createNewRefreshToken: (arg0: ExpressRequest) => Promise<void>;
  getNewUserFormModel: (arg0: ExpressRequest) => Promise<void>;
  resetPassword: (arg0: ExpressRequest) => Promise<void>;
  // verifyTempToken: (arg0: ExpressRequest) => Promise<void>;
  // updatePassword: (arg0: ExpressRequest) => Promise<void>;
};

export const UserController: Controller = {
  createNewUser,
  authenticateUser,
  createNewRefreshToken,
  getNewUserFormModel,
  resetPassword,
  // verifyTempToken,
  // updatePassword,
};
