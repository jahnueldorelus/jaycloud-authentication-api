import { Request as ExpressRequest } from "express";
import { createNewUser } from "./components/new-user";
import { updateUser } from "./components/update-user";
import { authenticateUser } from "./components/authenticate-user";
import { createNewRefreshToken } from "./components/new-refresh-token";
import { getNewUserFormModel } from "./components/new-user-form-model";
import { getUpdateUserFormModel } from "./components/update-user-form-model";
import { getAuthenticateUserFormModel } from "./components/authenticate-user-form-model";
import { getPasswordResetFormModel } from "./components/password-reset-form-model";
import { getUpdatePasswordFormModel } from "./components/update-password-form-model";
import { resetPassword } from "./components/reset-password";
import { updatePassword } from "./components/update-password";
import { redirectToUiAuth } from "./components/redirect-to-ui-auth";
import { redirectToUiService } from "./components/redirect-to-ui-service";
import { getSSOToken } from "./components/sso-token";
import { ExpressRequestAndUser } from "@app-types/authorization";

type Controller = {
  createNewUser: (arg0: ExpressRequest) => Promise<void>;
  updateUser: (arg0: ExpressRequestAndUser) => Promise<void>;
  authenticateUser: (arg0: ExpressRequest) => Promise<void>;
  createNewRefreshToken: (arg0: ExpressRequest) => Promise<void>;
  getNewUserFormModel: (arg0: ExpressRequest) => Promise<void>;
  getUpdateUserFormModel: (arg0: ExpressRequest) => Promise<void>;
  getAuthenticateUserFormModel: (arg0: ExpressRequest) => Promise<void>;
  getPasswordResetFormModel: (arg0: ExpressRequest) => Promise<void>;
  getUpdatePasswordFormModel: (arg0: ExpressRequest) => Promise<void>;
  resetPassword: (arg0: ExpressRequest) => Promise<void>;
  updatePassword: (arg0: ExpressRequest) => Promise<void>;
  redirectToUiAuth: (arg0: ExpressRequest) => Promise<void>;
  redirectToUiService: (arg0: ExpressRequestAndUser) => Promise<void>;
  getSSOToken: (arg0: ExpressRequest) => Promise<void>;
};

export const UserController: Controller = {
  createNewUser,
  updateUser,
  authenticateUser,
  createNewRefreshToken,
  getNewUserFormModel,
  getUpdateUserFormModel,
  getAuthenticateUserFormModel,
  getPasswordResetFormModel,
  getUpdatePasswordFormModel,
  resetPassword,
  updatePassword,
  redirectToUiAuth,
  redirectToUiService,
  getSSOToken,
};
