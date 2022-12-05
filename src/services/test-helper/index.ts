import { TokenData } from "@app-types/token/access-token";
import { RequestSuccess } from "@middleware/request-success";
import { envNames } from "@startup/config";
import {
  Express,
  Request as ExpressRequest,
  Response as ExpressResponse,
  Router,
} from "express";
import { Server } from "http";
import request from "supertest";

/**
 * Creates a request to an Express application
 * @param expressApp The Express application to send the request to
 * @param reqURL The path of the request
 * @param type The type of request to create. Defaults to a GET
 * @param origin The origin of the request. Defaults to localhost
 * @param data The data to send along with the request. Defaults to undefined.
 */
export const makeRequest = async (
  expressApp: Express | Server,
  reqURL: string,
  type: "get" | "put" | "post" | "delete",
  origin?: string | null,
  data?: string | object
) => {
  // Creates the request and returns it
  return await request(expressApp)
    [type](reqURL)
    .set("Origin", origin || <string>process.env[envNames.origins.local])
    .send(data ? data : undefined);
};

// Options for adding a fake route to an Express application
export type TestRouteOptions = {
  url: string;
  method: "get" | "put" | "post" | "delete";
  resData: any | null;
  resStatus: number;
};

/**
 * Adds a fake route to an Express application
 * @param expressApp The Express application
 * @param options The route options
 */
export const addFakeRoute = (
  expressApp: Express,
  options: TestRouteOptions
) => {
  const testRouter = Router();
  testRouter.all(options.url, (req: ExpressRequest, res: ExpressResponse) => {
    res.status(options.resStatus).send(options.resData);
  });
  expressApp.use(testRouter);
};

/**
 * Retrieves the express server
 */
export const getExpressServer = () => {
  return require("../../../index");
};

/**
 * Takes an Express request and sets it up to pass when using an Express server
 * that has the successful request middleware handler.
 * @param req An Express request
 */
export const makeRequestPass = async (req: ExpressRequest) => {
  RequestSuccess(req, {});
};

/**
 * Retrieves a fake user for a request.
 */
export const getFakeRequestUser = () => {
  const reqUser: TokenData = {
    firstName: "test",
    lastName: "test",
    email: "test@test.com",
    id: 1,
    exp: 1516239022,
    iat: 1516239022,
  };

  return reqUser;
};

/**
 * Retrieves a fake JWT token based on the information
 * of the fake request user.
 */
export const getFakeRequestToken = () => {
  return (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
    "eyJmaXJzdE5hbWUiOiJ0ZXN0IiwibGFzdE5hbWUiOiJ0" +
    "ZXN0IiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwiaWQiOjEsImV4c" +
    "CI6MTUxNjIzOTAyMiwiaWF0IjoxNTE2MjM5MDIyfQ." +
    "2fszgKirnyaR_EgpgT_5I1fyeGpMHcBo2a8awzVa2GQ"
  );
};
