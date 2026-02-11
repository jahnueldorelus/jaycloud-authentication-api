import { getMockReq } from "@jest-mock/express";
import { createNewUser } from "@controller/user/components/new-user";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { mockDb } from "@test-helpers/mocks/mock-database";
import { getMockUser } from "@test-helpers/mocks/mock-user";
import { envNames } from "@startup/config";
import { getMockRefreshTokenFamily } from "@test-helpers/mocks/mock-refresh-token-family";
import { getMockRefreshToken } from "@test-helpers/mocks/mock-refresh-token";
import { getMockSsoToken } from "@test-helpers/mocks/mock-sso-token";
import { databaseQuery } from "@services/database/queries";
import { NewUser } from "@app-types/user/new-user";
import { db } from "@services/database";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";
import { CookieInfo, ExtraHeaders } from "@app-types/request-success";

describe("Controller - User -> Creating a new user", () => {
  process.env[envNames.jwt.privateKey] = "fake-private-key";
  process.env[envNames.jwt.alg] = "none";
  process.env[envNames.jwt.accessExpiration] = "7d";
  const cookieKey = "test-cookie-key";
  process.env[envNames.cookie.key] = cookieKey;

  let mockHttpRequest = getMockReq();
  const mockResponseServerErrorMessage = "Failed to create a new account.";
  const mockUser = getMockUser();
  const newUserRequestBody: Omit<NewUser, "isAdmin"> = {
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    password: "fake-password",
  };

  const mockBadRequestError = jest.fn();
  const mockServerError = jest.fn();
  const mockValidationError = jest.fn();
  const mockRequestError = getMockRequestError({
    validation: mockValidationError,
    badRequest: mockBadRequestError,
    server: mockServerError,
  });

  mockDb.refreshTokenFamily.createFamily.mockImplementation(async () =>
    getMockRefreshTokenFamily(),
  );
  mockDb.refreshToken.createRefreshToken.mockImplementation(async () =>
    getMockRefreshToken(),
  );
  mockDb.ssoToken.createToken.mockImplementation(async () => getMockSsoToken());
  mockDb.user.createUser.mockImplementation(
    async () =>
      (await mockUser.generateAuthCredentials()) ||
      databaseQuery.createFailedQuery("server-error", null),
  );

  beforeEach(() => {
    mockHttpRequest.body = newUserRequestBody;
  });

  afterEach(() => {
    mockHttpRequest = getMockReq();
    mockValidationError.mockClear();
    mockRequestError.mockClear();
  });

  it("Should fail due to an invalid request body", async () => {
    mockHttpRequest.body = {};

    await createNewUser(mockHttpRequest);

    expect(mockValidationError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      expect.any(Error),
    );
  });

  it("Should fail to create a new user due to a duplicate error", async () => {
    mockDb.user.createUser.mockImplementationOnce(async () =>
      databaseQuery.createFailedQuery("duplicate-user", null),
    );

    await createNewUser(mockHttpRequest);

    expect(mockDb.user.createUser).toHaveBeenCalled();
    expect(mockBadRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      expect.any(Error),
    );
  });

  it("Should fail to create a new user due to a server error", async () => {
    mockDb.user.createUser.mockImplementationOnce(async () =>
      databaseQuery.createFailedQuery("server-error", null),
    );

    await createNewUser(mockHttpRequest);

    expect(mockDb.user.createUser).toHaveBeenCalled();
    expect(mockServerError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      Error(mockResponseServerErrorMessage),
    );
  });

  it("Should successfully create a new user", async () => {
    const userAuthenticatedData = await db.user.createUser(
      <NewUser>newUserRequestBody,
    );

    if (databaseQuery.isFailedQueryResult(userAuthenticatedData)) {
      fail(
        "The user authenticated data should be available. Are you sure you're mocking the database function to create a user?",
      );
    }

    const listOfResponseCookies: CookieInfo[] = [
      {
        expDate: expect.any(Date),
        key: cookieKey,
        value: userAuthenticatedData.ssoToken.ssoKey,
        sameSite: "lax",
      },
    ];

    const listOfResponseHeaders: ExtraHeaders = [
      // The access token
      {
        headerName: <string>process.env[envNames.jwt.accessReqHeader],
        headerValue: userAuthenticatedData.accessToken,
      },
      // The refresh token
      {
        headerName: <string>process.env[envNames.jwt.refreshReqHeader],
        headerValue: userAuthenticatedData.refreshToken.token,
      },
    ];

    await createNewUser(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalled();
    expect(mockRequestSuccess).toHaveBeenCalledWith(
      mockHttpRequest,
      userAuthenticatedData.userPublicInfo,
      listOfResponseHeaders,
      null,
      listOfResponseCookies,
    );
  });
});
