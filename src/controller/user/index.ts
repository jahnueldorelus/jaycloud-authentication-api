import { Request as ExpressRequest } from "express";
import { createNewUser } from "./components/new-user";
import { authenticateUser } from "./components/authenticate-user";
import { createNewRefreshToken } from "./components/new-refresh-token";
// import { getFormModels } from "./Components/NewUserFormModel";

type Controller = {
  createNewUser: (arg0: ExpressRequest) => Promise<void>;
  authenticateUser: (arg0: ExpressRequest) => Promise<void>;
  createNewRefreshToken: (arg0: ExpressRequest) => Promise<void>;
  getFormModels: (arg0: ExpressRequest) => Promise<void>;
};

export const UserController: Controller = {
  createNewUser,
  authenticateUser,
  createNewRefreshToken,
  // refreshAccessToken,
  // getFormModels,
  getFormModels: async (req: ExpressRequest) => {},
};
