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
  let mockGetNewUserFormModel: jest.SpyInstance;
  let mockGetAuthenticateUserFormModel: jest.SpyInstance;
  let mockResetPassword: jest.SpyInstance;
  let mockUpdatePassword: jest.SpyInstance;

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
    mockGetNewUserFormModel = jest
      .spyOn(UserController, "getNewUserFormModel")
      .mockImplementation(makeRequestPass);
    mockGetAuthenticateUserFormModel = jest
      .spyOn(UserController, "getAuthenticateUserFormModel")
      .mockImplementation(makeRequestPass);
    mockResetPassword = jest
      .spyOn(UserController, "resetPassword")
      .mockImplementation(makeRequestPass);
    mockUpdatePassword = jest
      .spyOn(UserController, "updatePassword")
      .mockImplementation(makeRequestPass);
  });

  afterEach(async () => {
    mockServer.close();
    mockAuthenticateUser.mockRestore();
    mockCreateNewRefreshToken.mockRestore();
    mockCreateNewUser.mockRestore();
    mockGetNewUserFormModel.mockRestore();
    mockGetAuthenticateUserFormModel.mockRestore();
    mockResetPassword.mockRestore();
    mockUpdatePassword.mockRestore();
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
    await makeRequest(mockServer, `${baseUrl}/form-models/create-user`, "get");

    expect(mockGetNewUserFormModel).toHaveBeenCalledTimes(1);
  });

  it("Should make GET request to retrieve the form model to authenticate a user", async () => {
    await makeRequest(
      mockServer,
      `${baseUrl}/form-models/authenticate-user`,
      "get"
    );

    expect(mockGetAuthenticateUserFormModel).toHaveBeenCalledTimes(1);
  });

  it("Should make POST request to reset a user's password", async () => {
    await makeRequest(mockServer, `${baseUrl}/password-reset`, "post");

    expect(mockResetPassword).toHaveBeenCalledTimes(1);
  });

  it("Should make POST request to update a user's password", async () => {
    await makeRequest(mockServer, `${baseUrl}/update-password`, "post");

    expect(mockUpdatePassword).toHaveBeenCalledTimes(1);
  });
});
