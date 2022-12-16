import { IApprovedPasswordReset } from "@app-types/database/models/approved-password-reset";
import { RequestErrorMethods } from "@app-types/request-error";
import { JoiValidationParam } from "@app-types/tests/joi";
import { updatePassword } from "@controller/user/components/update-password";
import { getMockReq } from "@jest-mock/express";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { dbAuth } from "@services/database";
import { getFakeRequestUser } from "@services/test-helper";
import { Request as ExpressRequest } from "express";
import { ValidationError, ValidationResult } from "joi";
import moment from "moment";
import bcrypt from "bcrypt";

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

// Mocks database models
jest.mock("@services/database", () => ({
  dbAuth: {
    usersModel: {
      findOne: jest.fn(),
    },
    approvedPasswordResetModel: {
      findOneAndDelete: jest.fn(),
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

// Mocks moment date handler
jest.mock("moment", () => jest.fn());

describe("Route - Users: Updating a user's password", () => {
  let mockRequest: ExpressRequest;
  let mockRequestSuccess: jest.Mock;
  let mockRequestError: jest.Mock<Partial<RequestErrorMethods>>;
  let mockRequestErrorBadRequest: jest.Mock;
  let mockRequestErrorServer: jest.Mock;
  let mockRequestErrorValidation: jest.Mock;
  let mockMomentIsBefore: jest.Mock;
  let mockMoment: jest.Mock;

  let mockFindOneUser: jest.SpyInstance;
  let mockFindOneAndDeleteApprovedPassReset: jest.SpyInstance;
  let mockBcryptHash: jest.SpyInstance;

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

    mockMomentIsBefore = jest.fn(() => false);
    mockMoment = <jest.Mock>(<any>moment);
    mockMoment.mockImplementation(() => ({
      isBefore: mockMomentIsBefore,
    }));

    mockFindOneUser = jest
      .spyOn<any, any>(dbAuth.usersModel, "findOne")
      .mockImplementation(() => ({ ...getFakeRequestUser(), save: () => {} }));

    mockFindOneAndDeleteApprovedPassReset = jest
      .spyOn<any, any>(dbAuth.approvedPasswordResetModel, "findOneAndDelete")
      .mockImplementation(
        () => <IApprovedPasswordReset>{ expDate: new Date() }
      );

    mockBcryptHash = jest.spyOn(bcrypt, "hash").mockImplementation(() => true);
  });

  afterEach(() => {
    mockRequest.destroy();
    mockRequestSuccess.mockClear();
    mockRequestError.mockClear();
    mockRequestErrorServer.mockClear();
    mockRequestErrorValidation.mockClear();
    mockMomentIsBefore.mockClear();
    mockMoment.mockClear();
    mockFindOneUser.mockRestore();
    mockFindOneAndDeleteApprovedPassReset.mockRestore();
    mockBcryptHash.mockRestore();
  });

  describe("Failed requests due to validation error", () => {
    it("Should return a custom error message with the request's response", async () => {
      const reqBody: JoiValidationParam = {
        returnError: true,
        // Custom error message to be passed to request error handler
        message: "VALIDATION",
      };
      mockRequest.body = reqBody;

      await updatePassword(mockRequest);

      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqBody.message)
      );
    });

    it("Should return a default error message with the request's response", async () => {
      const reqBody: JoiValidationParam = { returnError: true };
      mockRequest.body = reqBody;

      await updatePassword(mockRequest);

      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqBody.message)
      );
    });
  });

  it("Should fail request due to no user found", async () => {
    mockFindOneUser.mockReturnValueOnce(false);

    await updatePassword(mockRequest);

    expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to no user found", async () => {
    mockFindOneUser.mockReturnValueOnce(false);

    await updatePassword(mockRequest);

    expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to no approved password reset found for given user", async () => {
    mockFindOneAndDeleteApprovedPassReset.mockReturnValueOnce(false);

    await updatePassword(mockRequest);

    expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to an expired approved password reset", async () => {
    mockMomentIsBefore.mockReturnValueOnce(true);

    await updatePassword(mockRequest);

    expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to a server error", async () => {
    mockBcryptHash.mockImplementationOnce(() => {
      throw Error();
    });

    await updatePassword(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should pass request successfully", async () => {
    await updatePassword(mockRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
  });
});
