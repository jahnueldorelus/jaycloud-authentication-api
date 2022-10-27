import { Request as ExpressRequest } from "express";
// import { createNewUser } from "./Components/NewUser";
// import { authenticateUser } from "./Components/AuthenticateUser";
// import { refreshAccessToken } from "./Components/NewRefreshToken";
// import { getFormModels } from "./Components/NewUserFormModel";

type Controller = {
  createNewUser: (arg0: ExpressRequest) => Promise<void>;
  authenticateUser: (arg0: ExpressRequest) => Promise<void>;
  refreshAccessToken: (arg0: ExpressRequest) => Promise<void>;
  getFormModels: (arg0: ExpressRequest) => Promise<void>;
};

export const UserController: Controller = {
  // createNewUser,
  // authenticateUser,
  // refreshAccessToken,
  // getFormModels,
  createNewUser: async (req: ExpressRequest) => {},
  authenticateUser: async (req: ExpressRequest) => {},
  refreshAccessToken: async (req: ExpressRequest) => {},
  getFormModels: async (req: ExpressRequest) => {},
};
