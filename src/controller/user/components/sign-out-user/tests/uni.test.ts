import { RequestRefreshToken } from "@app-types/token/refresh-token";
import { getMockReq } from "@jest-mock/express";
import { getMockRefreshToken } from "@test-helpers/mocks/mock-refresh-token";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { signOutUser } from "@controller/user/components/sign-out-user";
import { ExpressRequestAndUser } from "@app-types/authorization";
import { envNames } from "@startup/config";
import { mockDb } from "@test-helpers/mocks/mock-database";
import { getMockSsoToken } from "@test-helpers/mocks/mock-sso-token";
import { databaseQuery } from "@services/database/queries";
import { CookieRemoval } from "@app-types/request-success";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";

describe("Controller - User -> Signing out a user", () => {
  let mockHttpRequest: ExpressRequestAndUser = getMockReq();
  const mockSsoToken = getMockSsoToken();
  /** Environment variables for generating an access token **/
  process.env[envNames.jwt.privateKey] = "fake-private-key";
  process.env[envNames.jwt.alg] = "none";
  process.env[envNames.jwt.accessExpiration] = "7d";
  /*********************************************************/
  const cookieSsoId = "fake-sso-id";
  process.env[envNames.cookie.ssoId] = cookieSsoId;

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
  mockDb.refreshTokenFamily.deleteFamily.mockImplementation(async () => true);
  mockDb.ssoToken.deleteToken.mockImplementation(async () => true);

  beforeEach(() => {
    mockHttpRequest = getMockReq();
    mockHttpRequest.body = <RequestRefreshToken>{
      refreshToken: getMockRefreshToken().token,
    };
    mockHttpRequest.signedCookies[cookieSsoId] = mockSsoToken.ssoKey;
  });

  afterEach(() => {
    mockNotAuthorizedError.mockClear();
    mockServerError.mockClear();
    mockRequestError.mockClear();
    mockDb.refreshToken.getRefreshTokenByKey.mockClear();
    mockDb.refreshTokenFamily.deleteFamily.mockClear();
    mockDb.ssoToken.getToken.mockClear();
  });

  it("Should fail the request due to an invalid refresh token provided", async () => {
    mockHttpRequest.body = {};

    await signOutUser(mockHttpRequest);

    expect(mockNotAuthorizedError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(mockHttpRequest, Error());
  });

  it("Should fail the request due to no sso token provided", async () => {
    mockHttpRequest.signedCookies[cookieSsoId] = "";

    await signOutUser(mockHttpRequest);

    expect(mockNotAuthorizedError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(mockHttpRequest, Error());
  });

  describe("Retrieving the refresh token and sso token from the database", () => {
    describe("Retrieving the refresh token", () => {
      it("Should fail retrieving the refresh token due to it not existing", async () => {
        mockDb.refreshToken.getRefreshTokenByKey.mockImplementationOnce(
          async () => databaseQuery.createFailedQuery("bad-request", null),
        );

        await signOutUser(mockHttpRequest);

        expect(mockDb.refreshToken.getRefreshTokenByKey).toHaveBeenCalled();
        expect(mockNotAuthorizedError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalledWith(mockHttpRequest, Error());
      });

      it("Should fail retrieving the refresh token due to a server error", async () => {
        mockDb.refreshToken.getRefreshTokenByKey.mockImplementationOnce(
          async () => databaseQuery.createFailedQuery("server-error", null),
        );

        await signOutUser(mockHttpRequest);

        expect(mockDb.refreshToken.getRefreshTokenByKey).toHaveBeenCalled();
        expect(mockServerError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalledWith(mockHttpRequest, Error());
      });
    });

    describe("Retrieving the sso token", () => {
      it("Should fail retrieving the sso token due to it not existing", async () => {
        mockDb.ssoToken.getToken.mockImplementationOnce(async () =>
          databaseQuery.createFailedQuery("invalid-request", null),
        );

        await signOutUser(mockHttpRequest);

        expect(mockDb.ssoToken.getToken).toHaveBeenCalled();
        expect(mockNotAuthorizedError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalledWith(mockHttpRequest, Error());
      });

      it("Should fail retrieving the sso token due to a server error", async () => {
        mockDb.ssoToken.getToken.mockImplementationOnce(async () =>
          databaseQuery.createFailedQuery("server-error", null),
        );

        await signOutUser(mockHttpRequest);

        expect(mockDb.ssoToken.getToken).toHaveBeenCalled();
        expect(mockServerError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalledWith(mockHttpRequest, Error());
      });
    });
  });

  describe("Deleting the user's refresh and sso token", () => {
    const mockServerErrorMessage = "An error occurred logging out the user.";

    afterEach(() => {
      expect(mockDb.refreshTokenFamily.deleteFamily).toHaveBeenCalled();
      expect(mockDb.ssoToken.deleteToken).toHaveBeenCalled();
    });

    it("Should fail due to a server error deleting the user's refresh token", async () => {
      mockDb.refreshTokenFamily.deleteFamily.mockImplementationOnce(
        async () => false,
      );

      await signOutUser(mockHttpRequest);

      expect(mockServerError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockHttpRequest,
        Error(mockServerErrorMessage),
      );
    });

    it("Should fail due to a server error deleting the user's sso token", async () => {
      mockDb.ssoToken.deleteToken.mockImplementationOnce(async () => false);

      await signOutUser(mockHttpRequest);

      expect(mockServerError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockHttpRequest,
        Error(mockServerErrorMessage),
      );
    });
  });

  it("Should successfully sign out the user", async () => {
    await signOutUser(mockHttpRequest);

    const ssoCookieDeleteInfo: CookieRemoval = {
      key: cookieSsoId,
    };

    expect(mockRequestSuccess).toHaveBeenCalled();
    expect(mockRequestSuccess).toHaveBeenCalledWith(
      mockHttpRequest,
      true,
      null,
      null,
      null,
      [ssoCookieDeleteInfo],
    );
  });
});
