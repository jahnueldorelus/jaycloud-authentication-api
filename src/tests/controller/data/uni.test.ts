import { DataController } from "@controller/data";
import { getMockReq } from "@jest-mock/express";
import {
  requestAuthenticationChecked,
  getRequestUserData,
} from "@middleware/authorization";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import {
  getFakeUserTokenData,
  getFakeMongoDocumentId,
} from "@services/test-helper";
import { Request as ExpressRequest } from "express";
import axios from "axios";
import { DataRequest } from "@app-types/data";
import { dbAuth } from "@services/database";
import { IService } from "@app-types/database/models/services";
import { DBLoadedUser } from "@app-types/database/models/users";

// Mocks the Authorization
jest.mock("@middleware/authorization", () => ({
  requestAuthenticationChecked: jest.fn(),
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
  let mockRequestAuthenticationChecked: jest.Mock;
  let mockGetRequestUserData: jest.Mock;
  let mockRequestSuccess: jest.Mock;
  let mockRequestError: jest.Mock;
  let mockRequestErrorServer: jest.Mock;
  let mockRequestErrorValidation: jest.Mock;
  let mockRequestErrorBadRequest: jest.Mock;
  let mockAxios: jest.Mock;
  let mockAxiosIsAxiosError: jest.SpyInstance;
  let mockServicesFindOne: jest.SpyInstance;

  /**
   * Retrieves the body of a request that will be sent to an external server.
   * @param useFakeId Determines if a fake service id should be used
   */
  const getRequestBody = (useFakeId: boolean): DataRequest => {
    const serviceId = useFakeId ? "FAKE_SERVICE_ID" : getFakeMongoDocumentId();
    return {
      serviceId,
      apiPath: "/api/test",
      apiMethod: "GET",
    };
  };

  beforeEach(() => {
    mockRequest = getMockReq();

    mockRequestAuthenticationChecked = <jest.Mock>requestAuthenticationChecked;
    mockRequestAuthenticationChecked.mockImplementation(() => true);

    mockGetRequestUserData = <jest.Mock>getRequestUserData;
    mockGetRequestUserData.mockImplementation(() => {
      const dbLoadedUser: DBLoadedUser = <any>{ toPrivateJSON: jest.fn() };
      return { ...getFakeUserTokenData(), ...dbLoadedUser };
    });

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
    mockRequestAuthenticationChecked.mockClear();
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

  it("Should fail request due to validation error", async () => {
    mockRequest.body = getRequestBody(true);

    await DataController.transferRoute(mockRequest);

    expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
    expect(mockRequestError).toHaveBeenCalledWith(
      mockRequest,
      expect.any(Error)
    );
  });

  describe("Requests with no validation error", () => {
    const requestBody = getRequestBody(false);

    beforeEach(() => {
      mockRequest.body = requestBody;
    });

    it("Should fail request due to a bad request", async () => {
      mockServicesFindOne.mockReturnValueOnce(null);

      await DataController.transferRoute(mockRequest);

      expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Error)
      );
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

    it("Should pass the request succuessfully", async () => {
      mockServicesFindOne.mockReturnValueOnce(<IService>{ available: true });
      await DataController.transferRoute(mockRequest);

      mockServicesFindOne.mockReturnValueOnce(<IService>{
        available: true,
        apiPort: 15000,
      });
      await DataController.transferRoute(mockRequest);

      expect(mockAxios).toHaveBeenCalledTimes(2);
      expect(mockRequestSuccess).toHaveBeenCalledTimes(2);
    });
  });
});
