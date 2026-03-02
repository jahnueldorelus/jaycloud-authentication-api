import { getMockReq } from "@jest-mock/express";
import { redirectToAuthUi } from "..";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { envNames } from "@startup/config";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";
import { CookieInfo } from "@app-types/request-success";
import { RedirectToAuthUIResponse, ServiceUrl } from "@app-types/sso";
import { setMockEnvironmentVariables } from "@test-helpers/mocks/mock-process-env";

const mockHttpRequest = getMockReq();
setMockEnvironmentVariables();
const mockRequestErrorValidation = jest.fn();
const mockRequestError = getMockRequestError({
  validation: mockRequestErrorValidation,
});
const serviceUrlCookieKey = <string>process.env[envNames.cookie.serviceUrl];
const mockServiceUiUrl = <string>process.env[envNames.cookie.serviceUrl];
const mockProductionUiUrl = <string>process.env[envNames.uiBaseUrl.prod];
const mockDevelopementUiUrl = <string>process.env[envNames.uiBaseUrl.dev];
const listOfCookieInfos: CookieInfo[] = [
  {
    key: serviceUrlCookieKey,
    value: mockServiceUiUrl,
    sameSite: "strict",
  },
];

/**
 * Retrieves the response for redirecting a user to the authentication ui.
 * @param uiUrl The authentication url
 * @returns A response that will be sent to the user for a redirection to the
 *          authentication ui
 */
function getAuthenticationUiResponse(uiUrl: string): RedirectToAuthUIResponse {
  return {
    authUrl: uiUrl + "/login?sso=true",
  };
}

describe("Controller - SSO -> Redirect To Authentication UI", () => {
  afterEach(() => {
    mockRequestError.mockClear();
    mockRequestSuccess.mockClear();
  });

  it("Should fail the request due to it being invalid", () => {
    mockHttpRequest.body = null;
    redirectToAuthUi(mockHttpRequest);

    expect(mockRequestError).toHaveBeenCalledTimes(1);
    expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
  });

  describe("It should pass the request", () => {
    beforeEach(() => {
      setMockEnvironmentVariables({
        origins: {
          wanDev: mockDevelopementUiUrl,
          wanProd: mockProductionUiUrl,
        },
      });
      mockHttpRequest.body = <ServiceUrl>{
        serviceUrl: mockServiceUiUrl,
      };
    });

    it("Should pass the request and redirect to the production authentication ui", () => {
      setMockEnvironmentVariables({
        nodeEnv: "production",
      });

      redirectToAuthUi(mockHttpRequest);

      expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
      expect(mockRequestSuccess).toBeCalledWith(
        mockHttpRequest,
        expect.objectContaining(
          getAuthenticationUiResponse(mockProductionUiUrl),
        ),
        null,
        null,
        expect.arrayContaining(listOfCookieInfos),
      );
    });

    it("Should pass the request and redirect to the development authentication ui", () => {
      setMockEnvironmentVariables({
        nodeEnv: "development",
      });
      redirectToAuthUi(mockHttpRequest);

      expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
      expect(mockRequestSuccess).toBeCalledWith(
        mockHttpRequest,
        expect.objectContaining(
          getAuthenticationUiResponse(mockDevelopementUiUrl),
        ),
        null,
        null,
        expect.arrayContaining(listOfCookieInfos),
      );
    });
  });
});
