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
  let mockUpdateUser: jest.SpyInstance;
  let mockGetNewUserFormModel: jest.SpyInstance;
  let mockGetUpdateUserFormModel: jest.SpyInstance;
  let mockGetAuthenticateUserFormModel: jest.SpyInstance;
  let mockGetPasswordResetFormModel: jest.SpyInstance;
  let mockGetUpdatePasswordFormModel: jest.SpyInstance;
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
    mockUpdateUser = jest
      .spyOn(UserController, "updateUser")
      .mockImplementation(makeRequestPass);
    mockGetNewUserFormModel = jest
      .spyOn(UserController, "getNewUserFormModel")
      .mockImplementation(makeRequestPass);
    mockGetUpdateUserFormModel = jest
      .spyOn(UserController, "getUpdateUserFormModel")
      .mockImplementation(makeRequestPass);
    mockGetAuthenticateUserFormModel = jest
      .spyOn(UserController, "getAuthenticateUserFormModel")
      .mockImplementation(makeRequestPass);
    mockGetPasswordResetFormModel = jest
      .spyOn(UserController, "getPasswordResetFormModel")
      .mockImplementation(makeRequestPass);
    mockGetUpdatePasswordFormModel = jest
      .spyOn(UserController, "getUpdatePasswordFormModel")
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
    mockUpdateUser.mockRestore();
    mockGetNewUserFormModel.mockRestore();
    mockGetUpdateUserFormModel.mockRestore();
    mockGetAuthenticateUserFormModel.mockRestore();
    mockResetPassword.mockRestore();
    mockUpdatePassword.mockRestore();
  });

  it("Should make POST request to create a new user account", async () => {
    await makeRequest(mockServer, `${baseUrl}/new`, "post");

    expect(mockCreateNewUser).toHaveBeenCalledTimes(1);
  });

  it("Should make POST request to update a user's account", async () => {
    await makeRequest(mockServer, `${baseUrl}/update`, "post");

    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
  });

  it("Should make POST request to authenticate a user", async () => {
    await makeRequest(mockServer, `${baseUrl}/`, "post");

    expect(mockAuthenticateUser).toHaveBeenCalledTimes(1);
  });

  it("Should make POST request to create a new refresh token for a user", async () => {
    await makeRequest(mockServer, `${baseUrl}/refresh-token`, "post");

    expect(mockCreateNewRefreshToken).toHaveBeenCalledTimes(1);
  });

  describe("Should make GET request for a form model", () => {
    it("Should make GET request to retrieve the form model to create a new user", async () => {
      await makeRequest(
        mockServer,
        `${baseUrl}/form-models/create-user`,
        "get"
      );

      expect(mockGetNewUserFormModel).toHaveBeenCalledTimes(1);
    });

    it("Should make GET request to retrieve the form model to update a user", async () => {
      await makeRequest(
        mockServer,
        `${baseUrl}/form-models/update-user`,
        "get"
      );

      expect(mockGetUpdateUserFormModel).toHaveBeenCalledTimes(1);
    });

    it("Should make GET request to retrieve the form model to authenticate a user", async () => {
      await makeRequest(
        mockServer,
        `${baseUrl}/form-models/authenticate-user`,
        "get"
      );

      expect(mockGetAuthenticateUserFormModel).toHaveBeenCalledTimes(1);
    });

    it("Should retrieve the form model to reset a user's password", async () => {
      await makeRequest(
        mockServer,
        `${baseUrl}/form-models/password-reset`,
        "get"
      );

      expect(mockGetPasswordResetFormModel).toHaveBeenCalledTimes(1);
    });

    it("Should retrieve the form model to update a user's password", async () => {
      await makeRequest(
        mockServer,
        `${baseUrl}/form-models/update-password`,
        "get"
      );

      expect(mockGetUpdatePasswordFormModel).toHaveBeenCalledTimes(1);
    });
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
