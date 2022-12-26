import { RequestErrorMethods } from "@app-types/request-error";
import { JoiValidationParam } from "@app-types/tests/joi";
import { authenticateUser } from "@controller/user/components/authenticate-user";
import { getMockReq } from "@jest-mock/express";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { dbAuth } from "@services/database";
import { reqErrorMessages } from "@services/request-error-messages";
import { Request as ExpressRequest } from "express";
import { ValidationError, ValidationResult } from "joi";

// Mocks Joi validation
jest.mock("joi", () => ({
  ...jest.requireActual("joi"),
  object: () => ({
    validate: jest.fn((validateInfo: JoiValidationParam): ValidationResult => {
      if (validateInfo.returnError) {
        return {
          error: <ValidationError>{ message: validateInfo.message },
          value: undefined,
        };
      } else {
        return { error: undefined, value: validateInfo };
      }
    }),
  }),
}));

// Mocks Request Error handler
jest.mock("@middleware/request-error", () => ({
  RequestError: jest.fn(),
}));

// Mocks Request Success handler
jest.mock("@middleware/request-success", () => ({
  RequestSuccess: jest.fn(),
}));

// Mocks database connection
jest.mock("mongoose", () => ({
  connection: {
    startSession: () => ({
      startTransaction: jest.fn(),
      endSession: jest.fn(),
      inTransaction: jest.fn(() => true),
      abortTransaction: jest.fn(() => true),
      commitTransaction: jest.fn(),
    }),
  },
}));

// Mocks database user model
jest.mock("@services/database", () => ({
  dbAuth: {
    usersModel: { authenticateUser: jest.fn() },
    refreshTokensModel: { createToken: jest.fn(() => true) },
    refreshTokenFamiliesModel: { createTokenFamily: jest.fn() },
  },
}));

describe("Route - Users: Authenticating User", () => {
  let mockRequest: ExpressRequest;
  let mockSuccess: jest.Mock;
  let mockRequestError: jest.Mock<Partial<RequestErrorMethods>>;
  let mockRequestErrorBadRequest: jest.Mock;
  let mockRequestErrorServer: jest.Mock;
  let mockRequestErrorValidation: jest.Mock;
  let mockUserGenerateAccessToken: jest.SpyInstance;
  let mockDbAuthenticateUser: jest.SpyInstance;
  let mockDbCreateTokenFamily: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = getMockReq();

    mockSuccess = <jest.Mock>RequestSuccess;

    mockRequestErrorBadRequest = jest.fn();
    mockRequestErrorServer = jest.fn();
    mockRequestErrorValidation = jest.fn();
    mockRequestError = <jest.Mock>RequestError;
    mockRequestError.mockImplementation(() => ({
      badRequest: mockRequestErrorBadRequest,
      server: mockRequestErrorServer,
      validation: mockRequestErrorValidation,
    }));

    mockUserGenerateAccessToken = jest.fn(() => true);
    mockDbAuthenticateUser = jest
      .spyOn<any, any>(dbAuth.usersModel, "authenticateUser")
      .mockImplementation(() => ({
        generateAccessToken: mockUserGenerateAccessToken,
        toPrivateJSON: jest.fn(),
      }));

    mockDbCreateTokenFamily = jest
      .spyOn<any, any>(dbAuth.refreshTokenFamiliesModel, "createTokenFamily")
      .mockImplementation(() => true);
  });

  afterEach(() => {
    mockRequest.destroy();
    mockSuccess.mockClear();
    mockRequestError.mockClear();
    mockRequestErrorBadRequest.mockClear();
    mockRequestErrorServer.mockClear();
    mockRequestErrorValidation.mockClear();
    mockUserGenerateAccessToken.mockClear();
    mockDbAuthenticateUser.mockRestore();
    mockDbCreateTokenFamily.mockClear();
  });

  it("Should fail request due to invalid user", async () => {
    mockDbAuthenticateUser.mockReturnValueOnce(false);

    await authenticateUser(mockRequest);

    expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
    expect(mockRequestError).toHaveBeenCalledWith(
      mockRequest,
      Error(reqErrorMessages.authFailed)
    );
  });

  it("Should fail request due to server error generating a refresh token family", async () => {
    mockDbCreateTokenFamily.mockReturnValueOnce(false);

    await authenticateUser(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to server error generating an access token", async () => {
    mockUserGenerateAccessToken.mockReturnValueOnce(false);

    await authenticateUser(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should pass the request successfully", async () => {
    await authenticateUser(mockRequest);

    expect(mockSuccess).toHaveBeenCalledTimes(1);
  });
});
