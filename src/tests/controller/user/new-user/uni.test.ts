import { JoiValidationParam } from "@app-types/tests/joi";
import { ValidationError, ValidationResult } from "joi";
import { Request as ExpressRequest } from "express";
import { RequestErrorMethods } from "@app-types/request-error";
import { getMockReq } from "@jest-mock/express";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { dbAuth } from "@services/database";
import { createNewUser } from "@controller/user/components/new-user";

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

// Mocks bcrypt hashing
jest.mock("bcrypt", () => ({
  genSalt: () => {},
  hash: () => {},
}));

// Mocks database models
jest.mock("@services/database", () => ({
  dbAuth: {
    usersModel: {
      create: jest.fn(),
    },
    refreshTokensModel: {
      createToken: jest.fn(),
    },
    refreshTokenFamiliesModel: {
      createTokenFamily: jest.fn(),
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

describe("Route - Users: Creating a User", () => {
  let mockRequest: ExpressRequest;
  let mockRequestSuccess: jest.Mock;
  let mockRequestError: jest.Mock<Partial<RequestErrorMethods>>;
  let mockRequestErrorBadRequest: jest.Mock;
  let mockRequestErrorServer: jest.Mock;
  let mockRequestErrorValidation: jest.Mock;

  let mockCreateUser: jest.SpyInstance;
  let mockCreateRefreshTokenFamily: jest.SpyInstance;
  let mockCreateRefreshToken: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = getMockReq();

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

    mockCreateUser = jest
      .spyOn(dbAuth.usersModel, "create")
      .mockImplementation(() => [
        { generateAccessToken: () => true, toPrivateJSON: () => {} },
      ]);

    mockCreateRefreshTokenFamily = jest
      .spyOn<any, any>(dbAuth.refreshTokenFamiliesModel, "createTokenFamily")
      .mockImplementation(() => true);

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
    mockCreateUser.mockRestore();
    mockCreateRefreshTokenFamily.mockRestore();
    mockCreateRefreshToken.mockRestore();
  });

  describe("Failed requests due to validation error", () => {
    it("Should return a custom error message with the request's response", async () => {
      const reqBody: JoiValidationParam = {
        returnError: true,
        // Custom error message to be passed to request error handler
        message: "VALIDATION",
      };
      mockRequest.body = reqBody;

      await createNewUser(mockRequest);

      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqBody.message)
      );
    });

    it("Should return a default error message with the request's response", async () => {
      const reqBody: JoiValidationParam = { returnError: true };
      mockRequest.body = reqBody;

      await createNewUser(mockRequest);

      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqBody.message)
      );
    });
  });

  it("Should fail request due to server error creating a new user", async () => {
    mockCreateUser.mockReturnValueOnce([false]);

    await createNewUser(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to duplicate user email", async () => {
    mockCreateUser.mockImplementationOnce(() => {
      throw {
        code: 11000, // Mongoose duplicate value error code
        keyPattern: { email: 1 },
      };
    });

    await createNewUser(mockRequest);

    expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to server error creating a new refresh token family", async () => {
    mockCreateRefreshTokenFamily.mockReturnValueOnce(false);

    await createNewUser(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to server error creating a new refresh token", async () => {
    mockCreateRefreshToken.mockReturnValueOnce(false);

    await createNewUser(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should pass request successfully", async () => {
    await createNewUser(mockRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
  });
});
