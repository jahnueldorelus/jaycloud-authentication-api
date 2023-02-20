import { DataController } from "@controller/data";
import {
  getExpressServer,
  makeRequest,
  makeRequestPass,
} from "@services/test-helper";
import { Server } from "http";

// Mocks the database
jest.mock("@services/database", () => {});

describe("Routes - Users", () => {
  const baseUrl = "/api/data";
  let mockServer: Server;
  let mockTransferRoute: jest.SpyInstance;

  beforeEach(() => {
    mockServer = getExpressServer();
    mockTransferRoute = jest
      .spyOn(DataController, "transferRoute")
      .mockImplementation(makeRequestPass);
  });

  afterEach(() => {
    mockServer.close();
    mockTransferRoute.mockRestore();
  });

  it("Should make POST request to send data to another server", async () => {
    await makeRequest(mockServer, `${baseUrl}/`, "post");

    expect(mockTransferRoute).toHaveBeenCalledTimes(1);
  });
});
