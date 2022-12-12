import { getExpressServer } from "@services/test-helper";
import checkConfig, { CheckConfigReturn, envNames } from "@startup/config";
import express from "express";
import { Server } from "http";

// Mocks server configuration
jest.mock("@startup/config");

// Mocks Express server
jest.mock("express");

// Mocks server middleware
jest
  .mock("@startup/middleware", () => ({
    addStartMiddleware: jest.fn(),
    addEndMiddleware: jest.fn(),
  }))
  .mock("@startup/routes", () => ({
    addServerRoutes: jest.fn(),
  }));

describe("Startup - Server", () => {
  const environmentPorts = {
    development: 61177,
    test: 0,
    default: 61179,
  };
  let server: Server;
  let mockCheckConfig: jest.Mock;
  let mockExpressServer: jest.Mock;
  let mockExpressServerListen: jest.SpyInstance;
  let mockProcessExit: jest.SpyInstance;

  beforeEach(() => {
    mockCheckConfig = <jest.Mock>checkConfig;
    mockCheckConfig.mockImplementation(
      () => <CheckConfigReturn>{ configComplete: true }
    );

    mockProcessExit = jest
      .spyOn<any, any>(process, "exit")
      .mockImplementation(() => {});

    mockExpressServerListen = jest.fn();
    mockExpressServer = <jest.Mock>(express as any);
    mockExpressServer.mockImplementation(() => ({
      listen: mockExpressServerListen,
    }));
  });

  afterEach(() => {
    if (server) {
      server.close();
    }

    mockCheckConfig.mockClear();
    mockExpressServer.mockClear();
    mockExpressServerListen.mockClear();
    mockProcessExit.mockRestore();
  });

  it("Should not start server due to invalid configurations", async () => {
    mockCheckConfig.mockReturnValueOnce(<CheckConfigReturn>{
      configComplete: false,
    });

    server = await getExpressServer();

    expect(mockProcessExit).toHaveBeenCalledTimes(1);
  });

  it("Should start up server on the development port", async () => {
    process.env[envNames.nodeEnv] = "development";

    jest.isolateModules(() => {
      server = getExpressServer();
    });

    expect(mockExpressServerListen).toHaveBeenCalledTimes(1);
    expect(mockExpressServerListen).toHaveBeenCalledWith(
      environmentPorts.development,
      expect.anything()
    );
  });

  it("Should start up server on the test port", async () => {
    process.env[envNames.nodeEnv] = "test";

    jest.isolateModules(() => {
      server = getExpressServer();
    });

    expect(mockExpressServerListen).toHaveBeenCalledTimes(1);
    expect(mockExpressServerListen).toHaveBeenCalledWith(
      environmentPorts.test,
      expect.anything()
    );
  });

  it("Should start up server on the default port", async () => {
    process.env[envNames.nodeEnv] = "";

    jest.isolateModules(() => {
      server = getExpressServer();
    });

    expect(mockExpressServerListen).toHaveBeenCalledTimes(1);
    expect(mockExpressServerListen).toHaveBeenCalledWith(
      environmentPorts.default,
      expect.anything()
    );
  });
});
