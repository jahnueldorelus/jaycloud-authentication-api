import { UserController } from "@controller/user";
import {
  getExpressServer,
  makeRequest,
  makeRequestPass,
} from "@services/test-helper";
import { Server } from "http";

// Mocks the database
jest.mock("@services/database", () => {});

describe("Routes - Users", () => {
  const baseUrl = "/api/users";
  let mockServer: Server;
  let mockAuthenticateUser: jest.SpyInstance;
  let mockCreateNewRefreshToken: jest.SpyInstance;
  let mockCreateNewUser: jest.SpyInstance;
  let mockGetFormModels: jest.SpyInstance;

  beforeEach(() => {
    mockServer = getExpressServer();

    mockAuthenticateUser = jest
      .spyOn(UserController, "authenticateUser")
      .mockImplementation(makeRequestPass);
    mockCreateNewRefreshToken = jest
      .spyOn(UserController, "createNewRefreshToken")
      .mockImplementation(makeRequestPass);
    mockCreateNewUser = jest
      .spyOn(UserController, "createNewUser")
      .mockImplementation(makeRequestPass);
    mockGetFormModels = jest
      .spyOn(UserController, "getFormModels")
      .mockImplementation(makeRequestPass);
  });

  afterEach(async () => {
    mockServer.close();
    mockAuthenticateUser.mockRestore();
    mockCreateNewRefreshToken.mockRestore();
    mockCreateNewUser.mockRestore();
    mockGetFormModels.mockRestore();
  });

  it("Should make POST request to create a new user account", async () => {
    await makeRequest(mockServer, `${baseUrl}/new`, "post");

    expect(mockCreateNewUser).toHaveBeenCalledTimes(1);
  });

  it("Should make POST request to authenticate a user", async () => {
    await makeRequest(mockServer, `${baseUrl}/`, "post");

    expect(mockAuthenticateUser).toHaveBeenCalledTimes(1);
  });

  it("Should make POST request to create a new refresh token for a user", async () => {
    await makeRequest(mockServer, `${baseUrl}/refreshToken`, "post");

    expect(mockCreateNewRefreshToken).toHaveBeenCalledTimes(1);
  });

  it("Should make GET request to retrieve the form model to create a new user", async () => {
    await makeRequest(mockServer, `${baseUrl}/form-models`, "get");

    expect(mockGetFormModels).toHaveBeenCalledTimes(1);
  });
});
