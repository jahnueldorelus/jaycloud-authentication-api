import { getMockReq } from "@jest-mock/express";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { Request as ExpressRequest } from "express";
import { getServiceLogo } from "@controller/service/components/service-logo";
import { dbAuth } from "@services/database";
import { getFakeMongoDocumentId } from "@services/test-helper";

// Mocks the Request Success middleware
jest.mock("@middleware/request-success", () => ({
  RequestSuccess: jest.fn(),
}));

// Mocks the Request Error middleware
jest.mock("@middleware/request-error", () => ({
  RequestError: jest.fn(),
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
  let mockGetFakeServiceId: jest.Mock;

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

    mockGetFakeServiceId = jest.fn(() => getFakeMongoDocumentId());
  });

  afterEach(() => {
    mockRequest.destroy();
    mockRequestSuccess.mockClear();
    mockRequestError.mockClear();
    mockRequestErrorServer.mockClear();
    mockRequestErrorValidation.mockClear();
    mockRequestErrorBadRequest.mockClear();
    mockServicesModelFindById.mockRestore();
    mockGetFakeServiceId.mockClear();
  });

  describe("Failed requests due to validation error", () => {
    beforeEach(() => {
      mockGetFakeServiceId.mockReturnValueOnce("FAKE_SERVICE_ID");
    });

    it("Should return a custom error message with the request's response", async () => {
      await getServiceLogo(mockRequest, mockGetFakeServiceId());

      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Error)
      );
    });

    it("Should return a default error message with the request's response", async () => {
      await getServiceLogo(mockRequest, mockGetFakeServiceId());

      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Error)
      );
    });
  });

  it("Should fail request due to a bad request", async () => {
    // Makes retrieving a service from the database throw an error
    mockServicesModelFindById.mockReturnValueOnce(null);

    await getServiceLogo(mockRequest, mockGetFakeServiceId());

    expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to a server error", async () => {
    // Makes retrieving a service from the database throw an error
    mockServicesModelFindById.mockImplementationOnce(() => {
      throw Error();
    });

    await getServiceLogo(mockRequest, mockGetFakeServiceId());

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should pass the request successfully", async () => {
    await getServiceLogo(mockRequest, mockGetFakeServiceId());

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
  });
});
