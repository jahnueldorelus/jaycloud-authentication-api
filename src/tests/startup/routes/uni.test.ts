import { userRouter } from "@routes/users";
import { dataRouter } from "@routes/data";
import express from "express";
import { addServerRoutes } from "@startup/routes";

// Mocks the database
jest.mock("@services/database", () => {});

describe("Startup - Routes", () => {
  let mockServer: express.Express;
  let mockServerUse: jest.SpyInstance;

  beforeEach(() => {
    mockServer = express();
    mockServerUse = jest.spyOn(mockServer, "use");
  });

  afterEach(() => {
    mockServerUse.mockRestore();
  });

  it("Should pass - All routes are included", () => {
    addServerRoutes(mockServer);

    expect(mockServerUse).toBeCalledWith("/api/users", userRouter);
    expect(mockServerUse).toBeCalledWith("/api/data", dataRouter);
  });
});
