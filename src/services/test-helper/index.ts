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
