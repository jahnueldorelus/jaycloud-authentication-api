import { getMockReq } from "@jest-mock/express";
import { redirectToServiceUi } from "@controller/sso/components/redirect-to-ui-service";
import { mockMiddlewareAuthorization } from "@test-helpers/mocks/mock-middleware-authorization";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { ExpressRequestAndUser } from "@app-types/authorization";
import { envNames } from "@startup/config";
import { CookieRemoval } from "@app-types/request-success";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";
import { RedirectToServiceUIResponse } from "@app-types/sso";

const mockHttpRequest: ExpressRequestAndUser = getMockReq();
const mockRequestErrorNotAuthorized = jest.fn();
const mockRequestError = getMockRequestError({
  notAuthorized: mockRequestErrorNotAuthorized,
});

describe("Controller - SSO -> Redirect To Service UI", () => {
  it("Should fail the request due to it not being authorized", () => {
    mockMiddlewareAuthorization.getRequestUserData.mockImplementation(
      () => false
    );

    redirectToServiceUi(mockHttpRequest);

    expect(mockRequestError).toHaveBeenCalledTimes(1);
    expect(mockRequestErrorNotAuthorized).toHaveBeenCalledTimes(1);
  });

  it("Should successfully send the URL of the service the user was on before", () => {
    mockMiddlewareAuthorization.getRequestUserData.mockImplementationOnce(
      () => true
    );
    mockMiddlewareAuthorization.requestIsAuthorized.mockImplementationOnce(
      () => true
    );
    const testServiceUrl = "https://test-service-url.com";
    const serviceUrlCookieKey = <string>process.env[envNames.cookie.serviceUrl];
    mockHttpRequest.signedCookies[serviceUrlCookieKey] = testServiceUrl;
    const cookieDeletionList: CookieRemoval[] = [{ key: serviceUrlCookieKey }];
    const expectedReponse: RedirectToServiceUIResponse = {
      serviceUrl: testServiceUrl,
    };

    redirectToServiceUi(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    expect(mockRequestSuccess).toHaveBeenCalledWith(
      mockHttpRequest,
      expectedReponse,
      null,
      null,
      null,
      expect.arrayContaining(cookieDeletionList)
    );
  });
});
