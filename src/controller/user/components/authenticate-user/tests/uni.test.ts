import { getMockReq } from "@jest-mock/express";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { authenticateUser } from "@controller/user/components/authenticate-user";
import { UserCredentials } from "@app-types/user/authenticate-user";
import { mockDb } from "@test-helpers/mocks/mock-database";
import { databaseQuery } from "@services/database/queries";
import { getMockUser } from "@test-helpers/mocks/mock-user";
import { CookieInfo, ExtraHeaders } from "@app-types/request-success";
import { envNames } from "@startup/config";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";
import { getMockRefreshTokenFamily } from "@test-helpers/mocks/mock-refresh-token-family";
import { getMockRefreshToken } from "@test-helpers/mocks/mock-refresh-token";
import { getMockSsoToken } from "@test-helpers/mocks/mock-sso-token";
import { setMockEnvironmentVariables } from "@test-helpers/mocks/mock-process-env";

describe("Controller - User -> Authenticating a User", () => {
  setMockEnvironmentVariables();

  mockDb.refreshTokenFamily.createFamily.mockImplementation(async () =>
    getMockRefreshTokenFamily(),
  );
  mockDb.refreshToken.createRefreshToken.mockImplementation(async () =>
    getMockRefreshToken(),
  );
  mockDb.ssoToken.createToken.mockImplementation(async () => getMockSsoToken());

  const mockHttpRequest = getMockReq();
  const mockRequestErrorBadRequest = jest.fn();
  const mockRequestErrorServer = jest.fn();
  const mockRequestErrorValidation = jest.fn();
  const mockRequestError = getMockRequestError({
    badRequest: mockRequestErrorBadRequest,
    validation: mockRequestErrorValidation,
    server: mockRequestErrorServer,
  });
  const mockUser = getMockUser();

  beforeEach(() => {
    mockHttpRequest.body = <UserCredentials>{
      email: "test-email@fakedomain.com",
      password: "test-password",
    };
  });

  afterEach(() => {
    mockRequestError.mockClear();
    mockRequestErrorBadRequest.mockClear();
    mockRequestErrorServer.mockClear();
    mockRequestErrorValidation.mockClear();
  });

  it("Should fail the request due to the request's body being invalid", async () => {
    mockHttpRequest.body = {};

    await authenticateUser(mockHttpRequest);

    expect(mockRequestError).toBeCalledTimes(1);
    expect(mockRequestErrorValidation).toBeCalledTimes(1);
  });

  it("Should fail the request due to the user not existing", async () => {
    mockDb.user.authenticateUser.mockImplementationOnce(async () =>
      databaseQuery.createFailedQuery("invalid-user", null),
    );

    await authenticateUser(mockHttpRequest);

    expect(mockRequestError).toBeCalledTimes(1);
    expect(mockRequestErrorBadRequest).toBeCalledTimes(1);
  });

  it("Should fail the request due to the password being incorrect", async () => {
    mockDb.user.authenticateUser.mockImplementationOnce(async () =>
      databaseQuery.createFailedQuery("invalid-password", null),
    );

    await authenticateUser(mockHttpRequest);

    expect(mockRequestError).toBeCalledTimes(1);
    expect(mockRequestErrorBadRequest).toBeCalledTimes(1);
  });

  it("Should fail the request due to a server error", async () => {
    mockDb.user.authenticateUser.mockImplementationOnce(async () =>
      databaseQuery.createFailedQuery("server-error", null),
    );

    await authenticateUser(mockHttpRequest);

    expect(mockRequestError).toBeCalledTimes(1);
    expect(mockRequestErrorServer).toBeCalledTimes(1);
  });

  it("Should authenticate the user and return the user's info, access/refresh/sso token", async () => {
    const userData = await mockUser.generateAuthCredentials();

    if (userData) {
      mockDb.user.authenticateUser.mockImplementationOnce(
        async () =>
          userData || databaseQuery.createFailedQuery("server-error", null),
      );

      const listOfResponseCookies: CookieInfo[] = [
        {
          expDate: userData?.ssoToken.expDate,
          key: <string>process.env[envNames.cookie.ssoId],
          value: userData?.ssoToken.ssoKey || "",
          sameSite: "lax",
        },
      ];

      const listOfResponseHeaders: ExtraHeaders = [
        // The access token
        {
          headerName: <string>process.env[envNames.jwt.accessReqHeader],
          headerValue: userData?.accessToken || "",
        },
        // The refresh token
        {
          headerName: <string>process.env[envNames.jwt.refreshReqHeader],
          headerValue: userData?.refreshToken.token || "",
        },
      ];

      await authenticateUser(mockHttpRequest);

      expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
      expect(mockRequestSuccess).toHaveBeenCalledWith(
        mockHttpRequest,
        userData.userPublicInfo,
        listOfResponseHeaders,
        null,
        listOfResponseCookies,
      );
    } else {
      throw Error(
        "An error occurred trying to generate the user's fake authorization credentials",
      );
    }
  });
});
