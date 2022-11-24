import express from "express";
import cors from "cors";
import helmet from "helmet";
import bearerToken from "express-bearer-token";
import { addEndMiddleware, addStartMiddleware } from "@startup/middleware";
import { requestPassedWithSuccess } from "@middleware/request-success";
import { requestFailedWithError } from "@middleware/request-error";

jest.mock("cors", () => jest.fn(() => jest.fn()));
jest.mock("helmet", () => jest.fn(() => jest.fn()));
jest.mock("express-bearer-token", () => jest.fn(() => jest.fn()));

describe("Startup - Middleware", () => {
  let mockServer: express.Express;
  let mockServerUse: jest.SpyInstance;
  let mockJSON: jest.SpyInstance;
  let mockUrlEncoded: jest.SpyInstance;

  beforeEach(() => {
    mockServer = express();
    mockServerUse = jest.spyOn(mockServer, "use");
    mockJSON = jest.spyOn(express, "json");
    mockUrlEncoded = jest.spyOn(express, "urlencoded");
  });

  it("Should pass - All middleware added", () => {
    addStartMiddleware(mockServer);
    addEndMiddleware(mockServer);

    expect(cors).toHaveBeenCalledTimes(1);
    expect(mockJSON).toHaveBeenCalledTimes(1);
    expect(helmet).toHaveBeenCalledTimes(1);
    expect(mockUrlEncoded).toHaveBeenCalledTimes(1);
    expect(bearerToken).toHaveBeenCalledTimes(1);
    expect(mockServerUse).toBeCalledWith(requestPassedWithSuccess);
    expect(mockServerUse).toBeCalledWith(requestFailedWithError);
  });
});
