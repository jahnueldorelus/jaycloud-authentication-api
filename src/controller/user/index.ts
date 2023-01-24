import { Request as ExpressRequest } from "express";
import { createNewUser } from "./components/new-user";
import { authenticateUser } from "./components/authenticate-user";
import { createNewRefreshToken } from "./components/new-refresh-token";
import { getNewAndUpdateUserFormModel } from "./components/new-and-update-user-form-model";
import { getAuthenticateUserFormModel } from "./components/authenticate-user-form-model";
import { getPasswordResetFormModel } from "./components/password-reset-form-model";
import { getUpdatePasswordFormModel } from "./components/update-password-form-model";
import { resetPassword } from "./components/reset-password";
import { updatePassword } from "./components/update-password";

type Controller = {
  createNewUser: (arg0: ExpressRequest) => Promise<void>;
  authenticateUser: (arg0: ExpressRequest) => Promise<void>;
  createNewRefreshToken: (arg0: ExpressRequest) => Promise<void>;
  getNewUserFormModel: (arg0: ExpressRequest) => Promise<void>;
  getUpdateUserFormModel: (arg0: ExpressRequest) => Promise<void>;
  getAuthenticateUserFormModel: (arg0: ExpressRequest) => Promise<void>;
  getPasswordResetFormModel: (arg0: ExpressRequest) => Promise<void>;
  getUpdatePasswordFormModel: (arg0: ExpressRequest) => Promise<void>;
  resetPassword: (arg0: ExpressRequest) => Promise<void>;
  updatePassword: (arg0: ExpressRequest) => Promise<void>;
};

export const UserController: Controller = {
  createNewUser,
  authenticateUser,
  createNewRefreshToken,
  getNewUserFormModel: getNewAndUpdateUserFormModel(true),
  getUpdateUserFormModel: getNewAndUpdateUserFormModel(false),
  getAuthenticateUserFormModel,
  getPasswordResetFormModel,
  getUpdatePasswordFormModel,
  resetPassword,
  updatePassword,
};
