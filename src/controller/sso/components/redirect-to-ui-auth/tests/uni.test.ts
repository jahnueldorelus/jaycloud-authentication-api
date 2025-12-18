import { getMockReq } from "@jest-mock/express";
import { redirectToAuthUi } from "..";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { envNames } from "@startup/config";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";
import { CookieInfo } from "@app-types/request-success";
import { RedirectToAuthUIResponse, ServiceUrl } from "@app-types/sso";

const mockHttpRequest = getMockReq();
const mockRequestErrorValidation = jest.fn();
const mockRequestError = getMockRequestError({
  validation: mockRequestErrorValidation,
});
const serviceUrlCookieKey = <string>process.env[envNames.cookie.serviceUrl];
const fakeServiceUiUrl = "https://fake-url-for-testing.com";
const listOfCookieInfos: CookieInfo[] = [
  {
    key: serviceUrlCookieKey,
    value: fakeServiceUiUrl,
    sameSite: "strict",
  },
];
const mockProductionUiUrl = "test-production-ui-url";
const mockDevelopementUiUrl = "test-development-ui-url";

/**
 * Sets the node environment.
 * @param nodeEnv The type of environment the node test is in.
 */
function setNodeEnvironment(env: "production" | "development"): void {
  process.env[envNames.nodeEnv] = env;
}

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
      process.env[envNames.origins.wanProd] = mockProductionUiUrl;
      process.env[envNames.origins.wanDev] = mockDevelopementUiUrl;
      mockHttpRequest.body = <ServiceUrl>{
        serviceUrl: fakeServiceUiUrl,
      };
    });

    it("Should pass the request and redirect to the production authentication ui", () => {
      setNodeEnvironment("production");
      redirectToAuthUi(mockHttpRequest);

      expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
      expect(mockRequestSuccess).toBeCalledWith(
        mockHttpRequest,
        expect.objectContaining(
          getAuthenticationUiResponse(mockProductionUiUrl)
        ),
        null,
        null,
        expect.arrayContaining(listOfCookieInfos)
      );
    });

    it("Should pass the request and redirect to the development authentication ui", () => {
      setNodeEnvironment("development");
      redirectToAuthUi(mockHttpRequest);

      expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
      expect(mockRequestSuccess).toBeCalledWith(
        mockHttpRequest,
        expect.objectContaining(
          getAuthenticationUiResponse(mockDevelopementUiUrl)
        ),
        null,
        null,
        expect.arrayContaining(listOfCookieInfos)
      );
    });
  });
});
