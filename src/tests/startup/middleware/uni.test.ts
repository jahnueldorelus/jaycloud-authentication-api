import express, {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import bearerToken from "express-bearer-token";
import {
  addEndMiddleware,
  addStartMiddleware,
  corsOptions,
} from "@startup/middleware";
import { requestPassedWithSuccess } from "@middleware/request-success";
import { requestFailedWithError } from "@middleware/request-error";
import {
  addFakeRoute,
  makeRequest,
  TestRouteOptions,
} from "@services/test-helper";
import { envNames } from "@startup/config";

// Mocks the database
jest.mock("@services/database", () => {});

// Mock of the "cors" middlware
let corsMock: jest.Mock;

jest.mock("cors", () =>
  jest.fn(() => {
    const corsMiddlewareMock = jest.fn(
      (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
        next();
      }
    );
    corsMock = corsMiddlewareMock;

    return corsMiddlewareMock;
  })
);

// Mock of the "helmet" middleware
jest.mock("helmet", () =>
  jest.fn(
    () => (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
      next();
    }
  )
);

// Mock of the "bearer-token" middlware
jest.mock("express-bearer-token", () =>
  jest.fn(
    () => (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
      next();
    }
  )
);

describe("Startup - Middleware", () => {
  let mockExpressApp: express.Express;
  let mockServerUse: jest.SpyInstance;
  let mockJSON: jest.SpyInstance;
  let mockUrlEncoded: jest.SpyInstance;
  let originalProcessEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    mockExpressApp = express();
    mockServerUse = jest.spyOn(mockExpressApp, "use");
    mockJSON = jest.spyOn(express, "json");
    mockUrlEncoded = jest.spyOn(express, "urlencoded");
    originalProcessEnv = { ...process.env };
  });

  afterEach(() => {
    jest.resetModules();
    mockServerUse.mockRestore();
    mockJSON.mockRestore();
    mockUrlEncoded.mockRestore();
    process.env = { ...originalProcessEnv };
  });

  it("Should add all required middleware", () => {
    addStartMiddleware(mockExpressApp);
    addEndMiddleware(mockExpressApp);

    expect(cors).toHaveBeenCalledTimes(1);
    expect(mockJSON).toHaveBeenCalledTimes(1);
    expect(helmet).toHaveBeenCalledTimes(1);
    expect(mockUrlEncoded).toHaveBeenCalledTimes(1);
    expect(bearerToken).toHaveBeenCalledTimes(1);
    expect(mockServerUse).toBeCalledWith(requestPassedWithSuccess);
    expect(mockServerUse).toBeCalledWith(requestFailedWithError);
  });

  describe("CORS", () => {
    beforeEach(() => {
      const originalCors = jest.requireActual("cors");
      addStartMiddleware(mockExpressApp);
      corsMock.mockImplementation(originalCors(corsOptions()));
    });

    it("Should allow requests from known origins", async () => {
      const routeOptions: TestRouteOptions = {
        responseData: "success",
        method: "get",
        responseStatus: 200,
        url: "/",
      };
      addFakeRoute(mockExpressApp, routeOptions);

      const response = await makeRequest(
        mockExpressApp,
        routeOptions.url,
        routeOptions.method
      );

      expect(response.statusCode).toBe(200);
      expect(response.text).toBe(routeOptions.responseData);
    });

    it("Should deny requests from unknown origins", async () => {
      const response = await makeRequest(
        mockExpressApp,
        "/",
        "get",
        "unauthorized-origin"
      );

      expect(response.text.includes("does not have access")).toBe(true);
    });

    it("Should deny POSTMAN request with server in production mode", async () => {
      process.env[envNames.nodeEnv] = "production";

      const response = await makeRequest(mockExpressApp, "/", "get", "");

      expect(response.text.includes("does not have access")).toBe(true);
    });

    it("Should accept POSTMAN request with server in development mode", async () => {
      const routeOptions: TestRouteOptions = {
        responseData: "success",
        method: "get",
        responseStatus: 200,
        url: "/",
      };
      addFakeRoute(mockExpressApp, routeOptions);
      process.env[envNames.nodeEnv] = "development";

      const response = await makeRequest(
        mockExpressApp,
        routeOptions.url,
        routeOptions.method,
        ""
      );

      expect(response.statusCode).toBe(200);
      expect(response.text).toBe(routeOptions.responseData);
    });
  });
});
