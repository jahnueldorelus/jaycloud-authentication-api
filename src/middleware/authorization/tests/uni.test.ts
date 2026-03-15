import { getMockReq, getMockRes } from "@jest-mock/express";
import { setMockEnvironmentVariables } from "@test-helpers/mocks/mock-process-env";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { validateRequestAuthorization } from "..";
import { reqErrorMessages } from "@services/request-error-messages";
import { getMockUser } from "@test-helpers/mocks/mock-user";
import { mockDb } from "@test-helpers/mocks/mock-database";
import { ExpressRequestAndUser } from "@app-types/authorization";

setMockEnvironmentVariables();

describe("Middleare - Authorization", () => {
  let mockRequest: ExpressRequestAndUser = getMockReq();
  let mockResponse = getMockRes();
  const mockUser = getMockUser();

  const mockErrorUnauthorized = jest.fn();
  const mockRequestError = getMockRequestError({
    notAuthorized: mockErrorUnauthorized,
  });

  beforeEach(() => {
    mockRequest = getMockReq();
    mockResponse = getMockRes();
    mockRequestError.mockClear();
    mockErrorUnauthorized.mockClear();
  });

  describe("Authorization via JWT", () => {
    it("Should fail the request due to no token being provided with the request", async () => {
      await validateRequestAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      expect(mockRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqErrorMessages.invalidToken),
      );
      expect(mockErrorUnauthorized).toHaveBeenCalled();
      expect(mockResponse.next).toHaveBeenCalled();
    });

    it("Should fail the request due to the provided JWT token being invalid", async () => {
      mockRequest.token = "fake-JWT-token";

      await validateRequestAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      expect(mockRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqErrorMessages.invalidToken),
      );
      expect(mockErrorUnauthorized).toHaveBeenCalled();
      expect(mockResponse.next).toHaveBeenCalled();
    });

    it("Should fail the request due to the user provided in the JWT token not existing", async () => {
      mockDb.user.getUserByEmail.mockImplementationOnce(async () => null);
      mockRequest.token = mockUser.generateAccessToken();

      await validateRequestAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      expect(mockRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqErrorMessages.nonExistentUser),
      );
      expect(mockErrorUnauthorized).toHaveBeenCalled();
      expect(mockResponse.next).toHaveBeenCalled();
    });

    it("Should successfully authorize the request and set the user's info retrieved from the database into the request", async () => {
      mockDb.user.getUserByEmail.mockImplementationOnce(async () => mockUser);
      mockRequest.token = mockUser.generateAccessToken();

      await validateRequestAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      expect(mockRequest.user).toBe(mockUser);
      expect(mockResponse.next).toHaveBeenCalled();
    });
  });
});
