import { ExpressRequestAndUser } from "@app-types/authorization";
import { getMockReq } from "@jest-mock/express";
import { mockMiddlewareAuthorization } from "@test-helpers/mocks/mock-middleware-authorization";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";
import { getUserId } from "@controller/sso/components/get-user-id";
import { getMockUser } from "@test-helpers/mocks/mock-user";

const mockRequestNotAuthorized = jest.fn();
const mockRequestError = getMockRequestError({
  notAuthorized: mockRequestNotAuthorized,
});
const mockUser = getMockUser();
const mockHttpRequest: ExpressRequestAndUser = getMockReq();
mockHttpRequest.user = mockUser;

describe("Controller - SSO -> Get User Id From Request", () => {
  afterEach(() => {
    mockMiddlewareAuthorization.requestIsAuthorized.mockClear();
    mockRequestSuccess.mockClear();
  });

  it("Should not return any info due to the request not being authorized", () => {
    mockMiddlewareAuthorization.requestIsAuthorized.mockReturnValueOnce(false);

    getUserId(mockHttpRequest);

    expect(mockRequestError).toHaveBeenCalledTimes(1);
    expect(mockRequestNotAuthorized).toHaveBeenCalledTimes(1);
  });

  it("Should return the user's id due to the request being authorized", () => {
    mockMiddlewareAuthorization.requestIsAuthorized.mockReturnValueOnce(true);

    getUserId(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    expect(mockRequestSuccess).toHaveBeenCalledWith(
      mockHttpRequest,
      mockUser.id
    );
  });
});
