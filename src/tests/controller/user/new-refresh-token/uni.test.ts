import { Request as ExpressRequest } from "express";
import { RequestErrorMethods } from "@app-types/request-error";
import { getMockReq } from "@jest-mock/express";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { dbAuth } from "@services/database";
import { createNewRefreshToken } from "@controller/user/components/new-refresh-token";
import { reqErrorMessages } from "@services/request-error-messages";
import { RefreshToken } from "@app-types/token/refresh-token";
import { getFakeMongoGUID } from "@services/test-helper";

// Mocks database models
jest.mock("@services/database", () => ({
  dbAuth: {
    refreshTokensModel: {
      findOne: jest.fn(),
      createToken: jest.fn(),
    },
    refreshTokenFamiliesModel: {
      findById: jest.fn(),
    },
  },
}));

// Mocks database connection
jest.mock("mongoose", () => ({
  connection: {
    startSession: () => ({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      inTransaction: jest.fn(() => true),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
  },
}));

// Mocks Request Error handler
jest.mock("@middleware/request-error", () => ({
  RequestError: jest.fn(),
}));

// Mocks Request Success handler
jest.mock("@middleware/request-success", () => ({
  RequestSuccess: jest.fn(),
}));

describe("Route - Users: Creating a Refresh Token", () => {
  let mockRequest: ExpressRequest;
  let mockRequestSuccess: jest.Mock;
  let mockRequestError: jest.Mock<Partial<RequestErrorMethods>>;
  let mockRequestErrorBadRequest: jest.Mock;
  let mockRequestErrorServer: jest.Mock;
  let mockRequestErrorValidation: jest.Mock;
  let mockRefreshTokenIsExpired: jest.Mock;
  let mockGetRefreshTokenUser: jest.Mock;
  let mockFindOneRefreshToken: jest.SpyInstance;
  let mockFindByIdRefreshTokenFamily: jest.SpyInstance;
  let mockDeleteRefreshTokenFamily: jest.SpyInstance;
  let mockCreateRefreshToken: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = getMockReq();
    const requestBody: RefreshToken = {
      token: getFakeMongoGUID(),
    };
    mockRequest.body = requestBody;

    mockRequestSuccess = <jest.Mock>RequestSuccess;

    mockRequestErrorBadRequest = jest.fn();
    mockRequestErrorServer = jest.fn();
    mockRequestErrorValidation = jest.fn();
    mockRequestError = <jest.Mock>RequestError;
    mockRequestError.mockImplementation(() => ({
      badRequest: mockRequestErrorBadRequest,
      server: mockRequestErrorServer,
      validation: mockRequestErrorValidation,
    }));

    mockRefreshTokenIsExpired = jest.fn(() => false);

    mockGetRefreshTokenUser = jest.fn(() => ({
      generateAccessToken: () => true,
      toPrivateJSON: () => {},
    }));

    mockFindOneRefreshToken = jest
      .spyOn<any, any>(dbAuth.refreshTokensModel, "findOne")
      .mockImplementation(() => ({
        session: () => ({
          isExpired: mockRefreshTokenIsExpired,
          getUser: mockGetRefreshTokenUser,
          expireToken: () => {},
        }),
      }));

    mockDeleteRefreshTokenFamily = jest.fn(() => true);

    mockFindByIdRefreshTokenFamily = jest
      .spyOn<any, any>(dbAuth.refreshTokenFamiliesModel, "findById")
      .mockImplementation(() => ({
        deleteFamily: mockDeleteRefreshTokenFamily,
      }));

    mockCreateRefreshToken = jest
      .spyOn<any, any>(dbAuth.refreshTokensModel, "createToken")
      .mockImplementation(() => true);
  });

  afterEach(() => {
    mockRequest.destroy();
    mockRequestSuccess.mockClear();
    mockRequestError.mockClear();
    mockRequestErrorBadRequest.mockClear();
    mockRequestErrorServer.mockClear();
    mockRequestErrorValidation.mockClear();
    mockRefreshTokenIsExpired.mockClear();
    mockGetRefreshTokenUser.mockClear();
    mockFindOneRefreshToken.mockRestore();
    mockDeleteRefreshTokenFamily.mockRestore();
    mockFindByIdRefreshTokenFamily.mockRestore();
    mockCreateRefreshToken.mockRestore();
  });

  it("Should fail request due to a validation error", async () => {
    const reqBody: RefreshToken = {
      token: "FAKE_REFRESH_TOKEN_ID",
    };
    mockRequest.body = reqBody;

    await createNewRefreshToken(mockRequest);

    expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
    expect(mockRequestError).toHaveBeenCalledWith(
      mockRequest,
      expect.any(Error)
    );
  });

  describe("Failed requests due to invalid refresh token", () => {
    beforeEach(() => {
      mockRefreshTokenIsExpired.mockImplementation(() => true);
    });

    afterEach(() => {
      mockRefreshTokenIsExpired.mockImplementation(() => false);
    });

    it("Should fail deleting the invalid refresh token family", async () => {
      mockDeleteRefreshTokenFamily.mockReturnValueOnce(false);

      await createNewRefreshToken(mockRequest);

      expect(mockFindByIdRefreshTokenFamily).toHaveBeenCalledTimes(1);
      expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
    });

    it("Should successfully delete the invalid refresh token family", async () => {
      await createNewRefreshToken(mockRequest);

      expect(mockFindByIdRefreshTokenFamily).toHaveBeenCalledTimes(1);
      expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqErrorMessages.invalidToken)
      );
    });
  });

  it("Should fail request due to server error retrieving user from refresh token", async () => {
    mockGetRefreshTokenUser.mockReturnValueOnce(false);

    await createNewRefreshToken(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to server error creating a new refresh token", async () => {
    mockCreateRefreshToken.mockReturnValueOnce(false);

    await createNewRefreshToken(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should pass request successfully", async () => {
    await createNewRefreshToken(mockRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
  });
});
