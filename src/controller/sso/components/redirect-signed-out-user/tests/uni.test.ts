import { CookieRemoval } from "@app-types/request-success";
import { redirectSignedOutUser } from "@controller/sso/components/redirect-signed-out-user";
import { getMockReq } from "@jest-mock/express";
import { envNames } from "@startup/config";
import { setMockEnvironmentVariables } from "@test-helpers/mocks/mock-process-env";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";

const mockHttpRequest = getMockReq();
setMockEnvironmentVariables();
const serviceUrlCookieKey = <string>process.env[envNames.cookie.serviceUrl];
const listOfCookieRemovals: CookieRemoval[] = [{ key: serviceUrlCookieKey }];

/**
 * Sets the url of the service within a request's signed cookies.
 * @param serviceUrl The url of the service that will be retrieved from the cookies.
 */
function setServiceUrlCookieValue(serviceUrl: string): void {
  mockHttpRequest.signedCookies = {
    [serviceUrlCookieKey]: serviceUrl,
  };
}

describe("Controlller - SSO -> Redirect Signed Out User To Original Service They Came From", () => {
  afterEach(() => {
    mockRequestSuccess.mockClear();
  });

  it("Should successfully redirect the user back to the original service they came from", () => {
    const mockServiceUiUrl = "test-service-ui-url";
    setServiceUrlCookieValue(mockServiceUiUrl);

    redirectSignedOutUser(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    expect(mockRequestSuccess).toHaveBeenCalledWith(
      mockHttpRequest,
      expect.stringContaining(mockServiceUiUrl),
      null,
      null,
      null,
      expect.arrayContaining(listOfCookieRemovals),
    );
  });

  it("Should successfully redirect the user back to the production authentication ui", () => {
    const mockProductionUiUrl = "test-production-ui-url";
    setServiceUrlCookieValue(mockProductionUiUrl);
    setMockEnvironmentVariables({ nodeEnv: "production" });

    redirectSignedOutUser(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    expect(mockRequestSuccess).toHaveBeenCalledWith(
      mockHttpRequest,
      expect.stringContaining(mockProductionUiUrl),
      null,
      null,
      null,
      expect.arrayContaining(listOfCookieRemovals),
    );
  });

  it("Should successfully redirect the user back to the development authentication ui", () => {
    const mockDevelopmentUiUrl = "test-development-ui-url";
    setServiceUrlCookieValue(mockDevelopmentUiUrl);
    setMockEnvironmentVariables({ nodeEnv: "development" });

    redirectSignedOutUser(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    expect(mockRequestSuccess).toHaveBeenCalledWith(
      mockHttpRequest,
      expect.stringContaining(mockDevelopmentUiUrl),
      null,
      null,
      null,
      expect.arrayContaining(listOfCookieRemovals),
    );
  });
});
