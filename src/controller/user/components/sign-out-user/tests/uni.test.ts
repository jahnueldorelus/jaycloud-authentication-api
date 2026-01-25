import { RequestRefreshToken } from "@app-types/token/refresh-token";
import { getMockReq } from "@jest-mock/express";
import { getMockRefreshToken } from "@test-helpers/mocks/mock-refresh-token";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { getMockUser } from "@test-helpers/mocks/mock-user";
import { signOutUser } from "@controller/user/components/sign-out-user";
import { ExpressRequestAndUser } from "@app-types/authorization";
import { envNames } from "@startup/config";
import { mockDb } from "@test-helpers/mocks/mock-database";
import { getMockSsoToken } from "@test-helpers/mocks/mock-sso-token";
import { databaseQuery } from "@services/database/queries";

describe("Controller - User -> Signing out a user", () => {
  let mockHttpRequest: ExpressRequestAndUser = getMockReq();
  const mockUser = getMockUser();

  process.env[envNames.jwt.privateKey] = "fake-private-key";
  process.env[envNames.jwt.alg] = "none";
  process.env[envNames.jwt.accessExpiration] = "7d";

  const mockNotAuthorizedError = jest.fn();
  const mockServerError = jest.fn();
  const mockRequestError = getMockRequestError({
    notAuthorized: mockNotAuthorizedError,
    server: mockServerError,
  });

  mockDb.refreshToken.getRefreshTokenByKey.mockImplementation(async () =>
    getMockRefreshToken(),
  );
  mockDb.ssoToken.getToken.mockImplementation(async () => getMockSsoToken());

  beforeEach(() => {
    mockHttpRequest = getMockReq();
    mockHttpRequest.body = <RequestRefreshToken>{
      refreshToken: getMockRefreshToken().token,
    };
    mockHttpRequest.token = mockUser.generateAccessToken();
  });

  afterEach(() => {
    mockNotAuthorizedError.mockClear();
    mockServerError.mockClear();
    mockRequestError.mockClear();
  });

  it("Should fail the request due to an invalid refresh token provided", async () => {
    mockHttpRequest.body = {};

    await signOutUser(mockHttpRequest);

    expect(mockNotAuthorizedError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      Error('"refreshToken" is required'),
    );
  });

  it("Should fail the request due to an invalid access token provided", async () => {
    mockHttpRequest.token = "";

    await signOutUser(mockHttpRequest);

    expect(mockNotAuthorizedError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      Error('"accessToken" is not allowed to be empty'),
    );
  });

  describe("Retrieving the refresh token and access token from the database", () => {
    describe("Retrieving the refresh token", () => {
      it("Should fail retrieving the refresh token due to it not existing", async () => {
        mockDb.refreshToken.getRefreshTokenByKey.mockImplementationOnce(
          async () => databaseQuery.createFailedQuery("bad-request", null),
        );

        await signOutUser(mockHttpRequest);

        expect(mockNotAuthorizedError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalledWith(mockHttpRequest, Error());
      });

      it("Should fail retrieving the refresh token due to a server error", async () => {
        mockDb.refreshToken.getRefreshTokenByKey.mockImplementationOnce(
          async () => databaseQuery.createFailedQuery("server-error", null),
        );

        await signOutUser(mockHttpRequest);

        expect(mockServerError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalledWith(mockHttpRequest, Error());
      });
    });

    describe("Retrieving the access token", () => {
      it("Should fail retrieving the access token due to it not existing", async () => {
        mockDb.ssoToken.getToken.mockImplementationOnce(async () =>
          databaseQuery.createFailedQuery("invalid-request", null),
        );

        await signOutUser(mockHttpRequest);

        expect(mockNotAuthorizedError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalledWith(mockHttpRequest, Error());
      });

      it("Should fail retrieving the access token due to a server error", async () => {
        mockDb.ssoToken.getToken.mockImplementationOnce(async () =>
          databaseQuery.createFailedQuery("server-error", null),
        );

        await signOutUser(mockHttpRequest);

        expect(mockServerError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalledWith(mockHttpRequest, Error());
      });
    });
  });
});
