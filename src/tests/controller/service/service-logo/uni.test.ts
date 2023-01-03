import { getMockReq } from "@jest-mock/express";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { Request as ExpressRequest } from "express";
import { ValidationError, ValidationResult } from "joi";
import { ServiceController } from "@controller/service";
import { dbAuth } from "@services/database";
import { ServiceId } from "@app-types/service";

// Mocks the Request Success middleware
jest.mock("@middleware/request-success", () => ({
  RequestSuccess: jest.fn(),
}));

// Mocks the Request Error middleware
jest.mock("@middleware/request-error", () => ({
  RequestError: jest.fn(),
}));

// Mocks Joi validation
jest.mock("joi", () => ({
  ...jest.requireActual("joi"),
  object: () => ({
    validate: jest.fn((infoToValidate: ServiceId): ValidationResult => {
      if (!infoToValidate.serviceId) {
        return {
          error: <ValidationError>{ message: infoToValidate.serviceId },
          value: undefined,
        };
      } else {
        return { error: undefined, value: infoToValidate };
      }
    }),
  }),
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
    servicesModel: { findById: jest.fn() },
  },
}));

describe("Route - Services: Services List", () => {
  let mockRequest: ExpressRequest;
  let mockRequestSuccess: jest.Mock;
  let mockRequestError: jest.Mock;
  let mockRequestErrorServer: jest.Mock;
  let mockRequestErrorValidation: jest.Mock;
  let mockRequestErrorBadRequest: jest.Mock;
  let mockServicesModelFindById: jest.SpyInstance;
  let getFakeServiceId: jest.Mock;

  beforeEach(() => {
    mockRequest = getMockReq();

    mockRequestSuccess = <jest.Mock>RequestSuccess;

    mockRequestError = <jest.Mock>RequestError;
    mockRequestErrorServer = jest.fn();
    mockRequestErrorValidation = jest.fn();
    mockRequestErrorBadRequest = jest.fn();
    mockRequestError.mockImplementation(() => ({
      server: mockRequestErrorServer,
      validation: mockRequestErrorValidation,
      badRequest: mockRequestErrorBadRequest,
    }));

    mockServicesModelFindById = jest
      .spyOn<any, any>(dbAuth.servicesModel, "findById")
      .mockImplementation(() => true);

    getFakeServiceId = jest.fn(() => "FAKE_SERVICE_ID");
  });

  afterEach(() => {
    mockRequest.destroy();
    mockRequestSuccess.mockClear();
    mockRequestError.mockClear();
    mockRequestErrorServer.mockClear();
    mockRequestErrorValidation.mockClear();
    mockRequestErrorBadRequest.mockClear();
    mockServicesModelFindById.mockRestore();
    getFakeServiceId.mockClear();
  });

  it("Should fail request due to validation error", async () => {
    // Provides an empty string for the service id to make validation fail
    getFakeServiceId.mockReturnValueOnce("");

    await ServiceController.getServiceLogo(mockRequest, getFakeServiceId());

    expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
    expect(mockRequestError).toHaveBeenCalledWith(mockRequest, Error(""));
  });

  it("Should fail request due to a bad request", async () => {
    // Makes retrieving a service from the database throw an error
    mockServicesModelFindById.mockReturnValueOnce(null);

    await ServiceController.getServiceLogo(mockRequest, getFakeServiceId());

    expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to a server error", async () => {
    // Makes retrieving a service from the database throw an error
    mockServicesModelFindById.mockImplementationOnce(() => {
      throw Error();
    });

    await ServiceController.getServiceLogo(mockRequest, getFakeServiceId());

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should pass the request successfully", async () => {
    await ServiceController.getServiceLogo(mockRequest, getFakeServiceId());

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
  });
});
