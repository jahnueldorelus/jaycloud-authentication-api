import { ServiceController } from "@controller/service";
import {
  getExpressServer,
  makeRequest,
  makeRequestPass,
} from "@services/test-helper";
import { Server } from "http";

// Mocks the database
jest.mock("@services/database", () => {});

describe("Routes - Users", () => {
  const baseUrl = "/api/services";
  let mockServer: Server;
  let mockGetServiceLogo: jest.SpyInstance;
  let mockGetServices: jest.SpyInstance;

  beforeEach(() => {
    mockServer = getExpressServer();

    mockGetServiceLogo = jest
      .spyOn(ServiceController, "getServiceLogo")
      .mockImplementation(makeRequestPass);
    mockGetServices = jest
      .spyOn(ServiceController, "getServices")
      .mockImplementation(makeRequestPass);
  });

  afterEach(async () => {
    mockServer.close();
    mockGetServiceLogo.mockRestore();
    mockGetServices.mockRestore();
  });

  it("Should make GET request to get list of services", async () => {
    await makeRequest(mockServer, `${baseUrl}/`, "get");

    expect(mockGetServices).toHaveBeenCalledTimes(1);
  });

  it("Should make GET request to get service logo image", async () => {
    await makeRequest(mockServer, `${baseUrl}/logo/fakeServiceID`, "get");

    expect(mockGetServiceLogo).toHaveBeenCalledTimes(1);
  });
});
