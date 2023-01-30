import { JoiValidationParam } from "@app-types/tests/joi";
import { ValidationError, ValidationResult } from "joi";
import { emailService } from "@services/email";
import { Request as ExpressRequest } from "express";
import { RequestErrorMethods } from "@app-types/request-error";
import { getMockReq } from "@jest-mock/express";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { dbAuth } from "@services/database";
import { resetPassword } from "@controller/user/components/reset-password";
import { MailOptionsPasswordReset } from "@app-types/email";
import { envNames } from "@startup/config";
import process from "process";

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
      createApprovedPasswordReset: jest.fn(),
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

// Mocks email
jest.mock("@services/email", () => ({
  emailService: {
    sendMail: jest.fn(),
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

describe("Route - Users: Resetting a user's password", () => {
  let mockRequest: ExpressRequest;
  let mockRequestSuccess: jest.Mock;
  let mockRequestError: jest.Mock<Partial<RequestErrorMethods>>;
  let mockRequestErrorServer: jest.Mock;
  let mockRequestErrorValidation: jest.Mock;
  let mockEmailServiceSendMail: jest.Mock;
  let originalProcessEnv: object;

  let mockFindOneUser: jest.SpyInstance;
  let mockCreateApprovedPasswordReset: jest.SpyInstance;

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

    mockEmailServiceSendMail = <jest.Mock>emailService.sendMail;
    mockEmailServiceSendMail.mockImplementation(() => {});

    originalProcessEnv = { ...process.env };

    mockFindOneUser = jest
      .spyOn<any, any>(dbAuth.usersModel, "findOne")
      .mockImplementation(() => ({ getFullName: () => "" }));

    mockCreateApprovedPasswordReset = jest
      .spyOn<any, any>(
        dbAuth.approvedPasswordResetModel,
        "createApprovedPasswordReset"
      )
      .mockImplementation(() => true);
  });

  afterEach(() => {
    mockRequest.destroy();
    mockRequestSuccess.mockClear();
    mockRequestError.mockClear();
    mockRequestErrorServer.mockClear();
    mockRequestErrorValidation.mockClear();
    mockEmailServiceSendMail.mockClear();
    process.env = { ...originalProcessEnv };
    mockFindOneUser.mockRestore();
    mockCreateApprovedPasswordReset.mockRestore();
  });

  describe("Failed requests due to validation error", () => {
    it("Should return a custom error message with the request's response", async () => {
      const reqBody: JoiValidationParam = {
        returnError: true,
        // Custom error message to be passed to request error handler
        message: "VALIDATION",
      };
      mockRequest.body = reqBody;

      await resetPassword(mockRequest);

      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqBody.message)
      );
    });

    it("Should return a default error message with the request's response", async () => {
      const reqBody: JoiValidationParam = { returnError: true };
      mockRequest.body = reqBody;

      await resetPassword(mockRequest);

      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqBody.message)
      );
    });
  });

  it("Should fail request due to server error creating a new approved password reset", async () => {
    mockCreateApprovedPasswordReset.mockReturnValueOnce(false);

    await resetPassword(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should send an email with a reset link to the development UI", async () => {
    let emailOptions: MailOptionsPasswordReset = <MailOptionsPasswordReset>{};
    const devLink = <string>process.env[envNames.uiBaseUrl.dev];
    process.env[envNames.nodeEnv] = "development";

    mockEmailServiceSendMail.mockImplementationOnce(
      (options: MailOptionsPasswordReset) => {
        emailOptions = options;
      }
    );

    await resetPassword(mockRequest);

    expect(emailOptions.context.userLink.includes(devLink)).toBeTruthy();
  });

  it("Should send an email with a reset link to the production UI", async () => {
    let emailOptions: MailOptionsPasswordReset = <MailOptionsPasswordReset>{};
    const prodLink = <string>process.env[envNames.uiBaseUrl.prod];
    process.env[envNames.nodeEnv] = "production";

    mockEmailServiceSendMail.mockImplementationOnce(
      (options: MailOptionsPasswordReset) => {
        emailOptions = options;
      }
    );

    await resetPassword(mockRequest);

    expect(emailOptions.context.userLink.includes(prodLink)).toBeTruthy();
  });

  it("Should fail request due to server error sending user a password reset email", async () => {
    mockEmailServiceSendMail.mockImplementationOnce(
      (emailOptions, callback) => {
        callback(true);
      }
    );

    await resetPassword(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should pass request successfully even though user is not found", async () => {
    mockFindOneUser.mockReturnValueOnce(null);

    await resetPassword(mockRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
  });

  it("Should pass request successfully", async () => {
    await resetPassword(mockRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
  });
});
