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
interface JoiValidationParam extends Partial<DataRequest> {
  returnError: boolean;
  message?: string;
}
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

describe("Route - Data", () => {
  let mockRequest: ExpressRequest;
  let mockRequestIsAuthorized: jest.Mock;
  let mockGetRequestUserData: jest.Mock;
  let mockRequestSuccess: jest.Mock;
  let mockRequestError: jest.Mock;
  let mockRequestErrorServer: jest.Mock;
  let mockRequestErrorValidation: jest.Mock;
  let mockAxios: jest.Mock;
  let mockAxiosIsAxiosError: jest.SpyInstance;

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
    mockRequestError.mockImplementation(() => ({
      server: mockRequestErrorServer,
      validation: mockRequestErrorValidation,
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
  });

  afterEach(() => {
    mockRequest.destroy();
    mockRequestIsAuthorized.mockClear();
    mockGetRequestUserData.mockClear();
    mockRequestSuccess.mockClear();
    mockRequestError.mockClear();
    mockAxios.mockClear();
    mockAxiosIsAxiosError.mockRestore();
  });

  describe("Failed requests due to validation error", () => {
    it("An error message is returned", async () => {
      // Sets the validation of the request's body to fail
      const requestBody: JoiValidationParam = {
        returnError: true,
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

    it("No error message is returned", async () => {
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

  describe("Failed requests due to server error", () => {
    it("An error is thrown retrieving the user's data from the request", async () => {
      // Makes retrieving the user from the request throw an error
      mockGetRequestUserData.mockImplementationOnce(() => {
        throw Error();
      });

      await DataController.transferRoute(mockRequest);

      expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
    });

    it("An error is thrown while retrieving data from destined server", async () => {
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
      const reqBody: JoiValidationParam = {
        returnError: false,
        app: "test",
        appApiUrl: "/api/test",
      };
      const axiosReqBody: Partial<DataRequest> = { ...reqBody };
      delete axiosReqBody.app;
      delete axiosReqBody.appApiUrl;
      mockRequest.body = reqBody;
      mockRequest.method = "POST";

      await DataController.transferRoute(mockRequest);

      expect(mockAxios).toHaveBeenCalledTimes(1);
      expect(mockAxios).toHaveBeenCalledWith({
        data: axiosReqBody,
        url: reqBody.appApiUrl,
        method: mockRequest.method,
      });
      expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
