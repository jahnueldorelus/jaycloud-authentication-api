import { getMockReq } from "@jest-mock/express";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { Request as ExpressRequest } from "express";
import { dbAuth } from "@services/database";
import { ServiceController } from "@controller/service";

// Mocks the Request Success middleware
jest.mock("@middleware/request-success", () => ({
  RequestSuccess: jest.fn(),
}));

// Mocks the Request Error middleware
jest.mock("@middleware/request-error", () => ({
  RequestError: jest.fn(),
}));

// Mocks database user model
jest.mock("@services/database", () => ({
  dbAuth: {
    servicesModel: { find: jest.fn() },
  },
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

describe("Route - Data", () => {
  let mockRequest: ExpressRequest;
  let mockRequestSuccess: jest.Mock;
  let mockRequestError: jest.Mock;
  let mockRequestErrorServer: jest.Mock;
  let mockServicesFind: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = getMockReq();

    mockRequestSuccess = <jest.Mock>RequestSuccess;

    mockRequestError = <jest.Mock>RequestError;
    mockRequestErrorServer = jest.fn();
    mockRequestError.mockImplementation(() => ({
      server: mockRequestErrorServer,
    }));

    mockServicesFind = jest
      .spyOn<any, any>(dbAuth.servicesModel, "find")
      .mockImplementation(() => []);
  });

  afterEach(() => {
    mockRequest.destroy();
    mockRequestSuccess.mockClear();
    mockRequestError.mockClear();
    mockRequestErrorServer.mockClear();
    mockServicesFind.mockRestore();
  });

  it("Should fail due to a server error", async () => {
    // Makes retrieving the user from the request throw an error
    mockServicesFind.mockImplementationOnce(() => {
      throw Error();
    });

    await ServiceController.getServices(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should pass the request successfully", async () => {
    await ServiceController.getServices(mockRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
  });
});
