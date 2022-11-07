import { Request as ExpressRequest } from "express";
import { createNewUser } from "./components/new-user";
import { authenticateUser } from "./components/authenticate-user";
// import { refreshAccessToken } from "./Components/NewRefreshToken";
// import { getFormModels } from "./Components/NewUserFormModel";

type Controller = {
  createNewUser: (arg0: ExpressRequest) => Promise<void>;
  authenticateUser: (arg0: ExpressRequest) => Promise<void>;
  refreshAccessToken: (arg0: ExpressRequest) => Promise<void>;
  getFormModels: (arg0: ExpressRequest) => Promise<void>;
};

export const UserController: Controller = {
  createNewUser,
  authenticateUser,
  // refreshAccessToken,
  // getFormModels,
  refreshAccessToken: async (req: ExpressRequest) => {},
  getFormModels: async (req: ExpressRequest) => {},
};
