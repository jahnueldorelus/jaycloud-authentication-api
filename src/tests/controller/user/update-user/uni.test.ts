import { ExpressRequestAndUser } from "@app-types/authorization";
import { RequestErrorMethods } from "@app-types/request-error";
import { JoiValidationParam } from "@app-types/tests/joi";
import { updateUser } from "@controller/user/components/update-user";
import { getMockReq } from "@jest-mock/express";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { getFakeRequestUser } from "@services/test-helper";
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

// Mocks database connection
jest.mock("mongoose", () => ({
  connection: {
    startSession: jest.fn(() => ({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      inTransaction: jest.fn(() => true),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    })),
  },
}));

// Mocks authorization middleware
jest.mock("@middleware/authorization", () => ({
  getRequestUserData: jest.fn(() => ({
    ...getFakeRequestUser(),
    save: jest.fn(),
    update: jest.fn(),
    generateAccessToken: jest.fn(),
    toPrivateJSON: jest.fn(),
  })),
  requestIsAuthorized: jest.fn(() => true),
}));

// Mocks Request Error handler
jest.mock("@middleware/request-error", () => ({
  RequestError: jest.fn(),
}));

// Mocks Request Success handler
jest.mock("@middleware/request-success", () => ({
  RequestSuccess: jest.fn(),
}));

describe("Route - Users: Updating a user's password", () => {
  let mockRequest: ExpressRequestAndUser;
  let mockRequestSuccess: jest.Mock;
  let mockRequestError: jest.Mock<Partial<RequestErrorMethods>>;
  let mockRequestErrorServer: jest.Mock;
  let mockRequestErrorValidation: jest.Mock;

  beforeEach(() => {
    mockRequest = getMockReq();

    mockRequestSuccess = <jest.Mock>RequestSuccess;

    mockRequestErrorServer = jest.fn();
    mockRequestErrorValidation = jest.fn();
    mockRequestError = <jest.Mock>RequestError;
    mockRequestError.mockImplementation(() => ({
      server: mockRequestErrorServer,
      validation: mockRequestErrorValidation,
    }));
  });

  afterEach(() => {
    mockRequest.destroy();
    mockRequestSuccess.mockClear();
    mockRequestError.mockClear();
    mockRequestErrorServer.mockClear();
    mockRequestErrorValidation.mockClear();
  });

  describe("Failed requests due to validation error", () => {
    it("Should return a custom error message with the request's response", async () => {
      const reqBody: JoiValidationParam = {
        returnError: true,
        // Custom error message to be passed to request error handler
        message: "VALIDATION",
      };
      mockRequest.body = reqBody;

      await updateUser(mockRequest);

      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqBody.message)
      );
    });

    it("Should return a default error message with the request's response", async () => {
      const reqBody: JoiValidationParam = { returnError: true };
      mockRequest.body = reqBody;

      await updateUser(mockRequest);

      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqBody.message)
      );
    });
  });

  it("Should fail request due to server error", async () => {
    mockRequestSuccess.mockImplementationOnce(() => {
      throw Error();
    });

    await updateUser(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should pass request successfully", async () => {
    await updateUser(mockRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
  });
});
