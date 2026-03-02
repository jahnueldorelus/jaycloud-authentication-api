import { getMockReq } from "@jest-mock/express";
import { mockMiddlewareAuthorization } from "@test-helpers/mocks/mock-middleware-authorization";
import { signOutAuthRedirect } from "@controller/sso/components/sign-out-auth-redirect";
import { ExpressRequestAndUser } from "@app-types/authorization";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { ServiceUrl } from "@app-types/sso";
import { CookieInfo } from "@app-types/request-success";
import { envNames } from "@startup/config";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";
import { setMockEnvironmentVariables } from "@test-helpers/mocks/mock-process-env";

setMockEnvironmentVariables();
const mockHttpRequest: ExpressRequestAndUser = getMockReq();
const mockRequestErrorValidation = jest.fn();
const mockRequestErrorNotAuthorized = jest.fn();
const mockRequestError = getMockRequestError({
  validation: mockRequestErrorValidation,
  notAuthorized: mockRequestErrorNotAuthorized,
});

describe("Controller - SSO -> User URL redirect to sign out", () => {
  afterEach(() => {
    mockRequestError.mockClear();
    mockRequestSuccess.mockClear();
  });

  describe("Should fail the request due to an error", () => {
    it("An unauthorized error should occur", () => {
      mockMiddlewareAuthorization.requestIsAuthorized.mockImplementationOnce(
        () => false,
      );

      signOutAuthRedirect(mockHttpRequest);

      expect(mockRequestError).toHaveBeenCalledTimes(1);
      expect(mockRequestErrorNotAuthorized).toHaveBeenCalledTimes(1);
    });

    it("A validation error should occur", () => {
      mockMiddlewareAuthorization.requestIsAuthorized.mockImplementationOnce(
        () => true,
      );

      signOutAuthRedirect(mockHttpRequest);

      expect(mockRequestError).toHaveBeenCalledTimes(1);
      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
    });
  });

  describe("Should successfully return the url for the user to sign out", () => {
    const mockServiceUrl = "https://fake-service-url.com";
    const serviceUrlCookieKey = <string>process.env[envNames.cookie.serviceUrl];
    const listOfCookiesToSend: CookieInfo[] = [
      {
        key: serviceUrlCookieKey,
        value: mockServiceUrl,
        sameSite: "lax",
      },
    ];

    beforeEach(() => {
      mockMiddlewareAuthorization.requestIsAuthorized.mockImplementationOnce(
        () => true,
      );
      mockHttpRequest.body = <ServiceUrl>{
        serviceUrl: mockServiceUrl,
      };
    });

    it("Should return the production sign out url", () => {
      setMockEnvironmentVariables({ nodeEnv: "production" });
      const mockProductionSignOutUrl = <string>(
        process.env[envNames.origins.wanProd]
      );

      signOutAuthRedirect(mockHttpRequest);

      expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
      expect(mockRequestSuccess).toHaveBeenCalledWith(
        mockHttpRequest,
        `${mockProductionSignOutUrl}/logout`,
        null,
        null,
        expect.arrayContaining(listOfCookiesToSend),
      );
    });

    it("Should return the development sign out url", () => {
      setMockEnvironmentVariables({ nodeEnv: "development" });
      const mockDevelopmentSignOutUrl = <string>(
        process.env[envNames.origins.wanDev]
      );

      signOutAuthRedirect(mockHttpRequest);

      expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
      expect(mockRequestSuccess).toHaveBeenCalledWith(
        mockHttpRequest,
        `${mockDevelopmentSignOutUrl}/logout`,
        null,
        null,
        expect.arrayContaining(listOfCookiesToSend),
      );
    });
  });
});
