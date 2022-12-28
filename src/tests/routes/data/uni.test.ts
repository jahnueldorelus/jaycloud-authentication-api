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

  it("Should make GET request to send data to another server", async () => {
    await makeRequest(mockServer, `${baseUrl}/`, "get");

    expect(mockTransferRoute).toHaveBeenCalledTimes(1);
  });

  it("Should make POST request to send data to another server", async () => {
    await makeRequest(mockServer, `${baseUrl}/`, "post");

    expect(mockTransferRoute).toHaveBeenCalledTimes(1);
  });

  it("Should make PUT request to send data to another server", async () => {
    await makeRequest(mockServer, `${baseUrl}/`, "put");

    expect(mockTransferRoute).toHaveBeenCalledTimes(1);
  });

  it("Should make DELETE request to send data to another server", async () => {
    await makeRequest(mockServer, `${baseUrl}/`, "delete");

    expect(mockTransferRoute).toHaveBeenCalledTimes(1);
  });

  it("Should make PATCH request to send data to another server", async () => {
    await makeRequest(mockServer, `${baseUrl}/`, "patch");

    expect(mockTransferRoute).toHaveBeenCalledTimes(1);
  });
});
