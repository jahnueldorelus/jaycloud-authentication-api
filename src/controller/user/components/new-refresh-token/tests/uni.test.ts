import { CookieRemoval } from "@app-types/request-success";
import { getMockReq } from "@jest-mock/express";
import { databaseQuery } from "@services/database/queries";
import { envNames } from "@startup/config";
import { mockDb } from "@test-helpers/mocks/mock-database";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { createNewRefreshToken } from "@controller/user/components/new-refresh-token";
import { ExpressRequestAndUser } from "@app-types/authorization";
import { reqErrorMessages } from "@services/request-error-messages";
import { getMockSsoToken } from "@test-helpers/mocks/mock-sso-token";
import { getMockRefreshToken } from "@test-helpers/mocks/mock-refresh-token";
import { RequestRefreshToken } from "@app-types/token/refresh-token";

describe("Controller - User -> Retrieving a new refresh token", () => {
  let mockHttpRequest: ExpressRequestAndUser = getMockReq();
  const mockValidationError = jest.fn();
  const mockBadRequestError = jest.fn();
  const mockServerError = jest.fn();
  const mockRequestError = getMockRequestError({
    validation: mockValidationError,
    badRequest: mockBadRequestError,
    server: mockServerError,
  });
  const ssoTokenKey: string = <string>process.env[envNames.cookie.ssoId];
  const mockResponseCookieRemoval: CookieRemoval = {
    key: ssoTokenKey || "",
  };
  mockDb.ssoToken.getToken.mockImplementation(async () => getMockSsoToken());
  mockDb.refreshToken.getRefreshTokenByKey.mockImplementation(async () =>
    getMockRefreshToken(),
  );
  mockDb.refreshToken.expireRefreshToken.mockImplementation(async () => true);

  beforeEach(() => {
    mockHttpRequest = getMockReq();
    mockHttpRequest.body = <RequestRefreshToken>{
      refreshToken: "00000000-0000-0000-0000-000000000000",
    };
  });

  afterEach(() => {
    mockValidationError.mockClear();
    mockBadRequestError.mockClear();
    mockServerError.mockClear();
    mockRequestError.mockClear();
  });

  describe("Retrieving the user's SSO token from the database", () => {
    it("Should fail the request due to the user's sso token not existing in the database", async () => {
      mockDb.ssoToken.getToken.mockImplementationOnce(async () =>
        databaseQuery.createFailedQuery("invalid-request", null),
      );

      await createNewRefreshToken(mockHttpRequest);

      expect(mockBadRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockHttpRequest,
        new Error(reqErrorMessages.invalidToken),
        expect.arrayContaining([mockResponseCookieRemoval]),
      );
    });

    it("Should fail the request due to a server error retrieving the user's sso token from the database", async () => {
      mockDb.ssoToken.getToken.mockImplementationOnce(async () =>
        databaseQuery.createFailedQuery("server-error", null),
      );

      await createNewRefreshToken(mockHttpRequest);

      expect(mockServerError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockHttpRequest,
        new Error(reqErrorMessages.serverError),
        expect.arrayContaining([mockResponseCookieRemoval]),
      );
    });
  });

  it("Should fail the request due to the refresh token retrieved from the request being invalid", async () => {
    mockHttpRequest.body = {};

    await createNewRefreshToken(mockHttpRequest);

    expect(mockValidationError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      new Error(reqErrorMessages.invalidToken),
      expect.arrayContaining([mockResponseCookieRemoval]),
    );
  });

  describe("Retrieving the user's refresh token from the database", () => {
    it("Should fail the request due to the user's provided refresh token not existing in the database", async () => {
      mockDb.refreshToken.getRefreshTokenByKey.mockImplementationOnce(
        async () => databaseQuery.createFailedQuery("bad-request", null),
      );

      await createNewRefreshToken(mockHttpRequest);

      expect(mockBadRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockHttpRequest,
        new Error(reqErrorMessages.invalidToken),
        expect.arrayContaining([mockResponseCookieRemoval]),
      );
    });

    it("Should fail the request due to a server error attempting to retrieve the user's provided refresh token in the database", async () => {
      mockDb.refreshToken.getRefreshTokenByKey.mockImplementationOnce(
        async () => databaseQuery.createFailedQuery("server-error", null),
      );

      await createNewRefreshToken(mockHttpRequest);

      expect(mockServerError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockHttpRequest,
        new Error(reqErrorMessages.serverError),
        expect.arrayContaining([mockResponseCookieRemoval]),
      );
    });
  });

  it("Should fail the request due to the user's refresh token being expired", async () => {
    mockDb.refreshToken.getRefreshTokenByKey.mockImplementationOnce(
      async () => {
        const expiredDate = new Date();
        expiredDate.setMonth(expiredDate.getMonth() - 1);
        return getMockRefreshToken({
          expiration_date: expiredDate.toISOString(),
        });
      },
    );
    mockDb.refreshTokenFamily.deleteFamily.mockImplementationOnce(
      async () => true,
    );

    await createNewRefreshToken(mockHttpRequest);

    expect(mockDb.refreshTokenFamily.deleteFamily).toHaveBeenCalled();
    expect(mockBadRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      new Error(reqErrorMessages.invalidToken),
      expect.arrayContaining([mockResponseCookieRemoval]),
    );
  });

  it("Should fail expiring the user's refresh token", async () => {
    mockDb.refreshToken.expireRefreshToken.mockImplementationOnce(
      async () => false,
    );

    await createNewRefreshToken(mockHttpRequest);

    expect(mockDb.refreshToken.expireRefreshToken).toHaveBeenCalled();
    expect(mockServerError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      new Error(reqErrorMessages.serverError),
      expect.arrayContaining([mockResponseCookieRemoval]),
    );
  });

  it("Should fail retrieving the user's data from the database", async () => {
    mockDb.refreshToken.getUserOfToken.mockImplementationOnce(async () =>
      databaseQuery.createFailedQuery("server-error", null),
    );

    await createNewRefreshToken(mockHttpRequest);

    expect(mockDb.refreshToken.getUserOfToken).toHaveBeenCalled();
    expect(mockServerError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      new Error(reqErrorMessages.serverError),
      expect.arrayContaining([mockResponseCookieRemoval]),
    );
  });
});
