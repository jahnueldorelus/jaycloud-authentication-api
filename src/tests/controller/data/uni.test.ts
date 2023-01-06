import { DataController } from "@controller/data";
import { getMockReq } from "@jest-mock/express";
import {
  requestPassedAuthorization,
  getRequestUserData,
} from "@middleware/authorization";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { getFakeRequestUser } from "@services/test-helper";
import { Request as ExpressRequest } from "express";
import { ValidationError, ValidationResult } from "joi";
import axios from "axios";
import { DataRequest } from "@app-types/data";
import { JoiValidationParam } from "@app-types/tests/joi";
import { dbAuth } from "@services/database";
import { IService } from "@app-types/database/models/services";

// Mocks the Authorization
jest.mock("@middleware/authorization", () => ({
  requestPassedAuthorization: jest.fn(),
  getRequestUserData: jest.fn(),
}));

// Mocks the Request Success middleware
jest.mock("@middleware/request-success", () => ({
  RequestSuccess: jest.fn(),
}));

// Mocks the Request Error middleware
jest.mock("@middleware/request-error", () => ({
  RequestError: jest.fn(),
}));

// Mocks the Axios service
jest.mock("axios");

// Mocks Joi validation
type JoiValidationDataRequestParam = DataRequest & JoiValidationParam;
jest.mock("joi", () => ({
  ...jest.requireActual("joi"),
  object: () => ({
    validate: jest.fn(
      (validateInfo: JoiValidationDataRequestParam): ValidationResult => {
        if (validateInfo.returnError) {
          return {
            error: <ValidationError>{ message: validateInfo.message },
            value: undefined,
          };
        } else {
          return { error: undefined, value: validateInfo };
        }
      }
    ),
  }),
}));

// Mocks database user model
jest.mock("@services/database", () => ({
  dbAuth: {
    servicesModel: { findOne: jest.fn() },
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
  let mockRequestIsAuthorized: jest.Mock;
  let mockGetRequestUserData: jest.Mock;
  let mockRequestSuccess: jest.Mock;
  let mockRequestError: jest.Mock;
  let mockRequestErrorServer: jest.Mock;
  let mockRequestErrorValidation: jest.Mock;
  let mockRequestErrorBadRequest: jest.Mock;
  let mockAxios: jest.Mock;
  let mockAxiosIsAxiosError: jest.SpyInstance;
  let mockServicesFindOne: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = getMockReq();

    mockRequestIsAuthorized = <jest.Mock>requestPassedAuthorization;
    mockRequestIsAuthorized.mockImplementation(() => true);

    mockGetRequestUserData = <jest.Mock>getRequestUserData;
    mockGetRequestUserData.mockImplementation(() => getFakeRequestUser());

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

    mockAxios = <jest.Mock>(axios as unknown);
    mockAxios.mockImplementation(() => ({
      __esModule: true,
      default: jest.fn(),
    }));
    mockAxiosIsAxiosError = jest
      .spyOn(axios, "isAxiosError")
      .mockImplementation(() => {
        return false;
      });

    mockServicesFindOne = jest
      .spyOn<any, any>(dbAuth.servicesModel, "findOne")
      .mockImplementation(() => <IService>{ available: true });
  });

  afterEach(() => {
    mockRequest.destroy();
    mockRequestIsAuthorized.mockClear();
    mockGetRequestUserData.mockClear();
    mockRequestSuccess.mockClear();
    mockRequestError.mockClear();
    mockRequestErrorBadRequest.mockClear();
    mockRequestErrorServer.mockClear();
    mockRequestErrorValidation.mockClear();
    mockAxios.mockClear();
    mockAxiosIsAxiosError.mockRestore();
    mockServicesFindOne.mockRestore();
  });

  describe("Failed requests due to validation error", () => {
    it("Should return a custom error message with the request's response", async () => {
      // Sets the validation of the request's body to fail
      const requestBody: JoiValidationParam = {
        returnError: true,
        // Custom error message to be passed to request error handler
        message: "VALIDATION",
      };
      mockRequest.body = requestBody;

      await DataController.transferRoute(mockRequest);

      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(requestBody.message)
      );
    });

    it("Should return a default error message with the request's response", async () => {
      // Sets the validation of the request's body to fail
      const requestBody: JoiValidationParam = {
        returnError: true,
      };
      mockRequest.body = requestBody;

      await DataController.transferRoute(mockRequest);

      expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(requestBody.message)
      );
    });
  });

  it("Should fail request due to a bad request", async () => {
    mockServicesFindOne.mockReturnValueOnce(null);

    await DataController.transferRoute(mockRequest);

    expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
  });

  describe("Failed requests due to server error", () => {
    it("Should fail due to error retrieving the list of services available from the database", async () => {
      mockServicesFindOne.mockImplementationOnce(() => {
        throw Error();
      });

      await DataController.transferRoute(mockRequest);

      expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
    });

    it("Should fail due to error thrown while retrieving the user's data from the request", async () => {
      // Makes retrieving the user from the request throw an error
      mockGetRequestUserData.mockImplementationOnce(() => {
        throw Error();
      });

      await DataController.transferRoute(mockRequest);

      expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
    });

    it("Should fail due to request service being unavailable", async () => {
      mockServicesFindOne.mockReturnValueOnce(<IService>{ available: false });

      await DataController.transferRoute(mockRequest);

      expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
    });

    it("Should fail due to error thrown while retrieving data from destined server", async () => {
      mockAxios.mockImplementationOnce(() => {
        throw Error();
      });
      mockAxiosIsAxiosError.mockImplementationOnce(() => true);

      await DataController.transferRoute(mockRequest);

      expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
    });
  });

  describe("Successful requests", () => {
    it("Should pass the request successfully", async () => {
      await DataController.transferRoute(mockRequest);

      expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    });

    it("Should pass the correct HTTP url and method to Axios", async () => {
      mockGetRequestUserData.mockReturnValueOnce(null);
      const reqBody: JoiValidationDataRequestParam = {
        returnError: false,
        serviceId: "test",
        apiPath: "/api/test",
      };
      const axiosReqBody: Partial<DataRequest> = { ...reqBody };
      delete axiosReqBody.serviceId;
      delete axiosReqBody.apiPath;
      mockRequest.body = reqBody;
      mockRequest.method = "POST";

      await DataController.transferRoute(mockRequest);

      expect(mockAxios).toHaveBeenCalledTimes(1);
      expect(mockAxios).toHaveBeenCalledWith({
        data: axiosReqBody,
        url: expect.stringContaining(reqBody.apiPath),
        method: mockRequest.method,
      });
      expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
