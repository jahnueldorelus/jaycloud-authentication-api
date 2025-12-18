import { mockMiddlewareAuthorization } from "@test-helpers/mocks/mock-middleware-authorization";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { getMockReq } from "@jest-mock/express";
import { getUser } from "@controller/sso/components/get-user";
import { ExpressRequestAndUser } from "@app-types/authorization";
import { getMockUser } from "@test-helpers/mocks/mock-user";

const mockRequestNotAuthorized = jest.fn();
const mockRequestError = getMockRequestError({
  notAuthorized: mockRequestNotAuthorized,
});
const mockUser = getMockUser();
const mockHttpRequest: ExpressRequestAndUser = getMockReq();
mockHttpRequest.user = mockUser;

describe("Controller - SSO - Get User From Request", () => {
  afterEach(() => {
    mockMiddlewareAuthorization.requestIsAuthorized.mockClear();
    mockRequestSuccess.mockClear();
  });

  it("Should not return any info due to the request not being authorized", () => {
    mockMiddlewareAuthorization.requestIsAuthorized.mockReturnValueOnce(false);

    getUser(mockHttpRequest);

    expect(mockRequestError).toHaveBeenCalledTimes(1);
    expect(mockRequestNotAuthorized).toHaveBeenCalledTimes(1);
  });

  it("Should return the user's info due to the request being authorized", () => {
    mockMiddlewareAuthorization.requestIsAuthorized.mockReturnValueOnce(true);

    getUser(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    expect(mockRequestSuccess).toHaveBeenCalledWith(
      mockHttpRequest,
      expect.objectContaining(mockUser.getSsoInfoJson())
    );
  });
});
