import * as moduleAuthorization from "@middleware/authorization";
import axios, { AxiosResponse } from "axios";
import { DataController } from "@controller/data";
import { getMockReq } from "@jest-mock/express";
import { Request as ExpressRequest } from "express";
import { DataRequest } from "@app-types/data";
import { databaseQuery } from "@services/database/queries";
import { LoadedService } from "@services/database/table-models/loaded-service";
import { DatabaseService } from "@services/database/tables/service/types";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";
import { mockDb } from "@test-helpers/mocks/mock-database";

jest.mock("axios");
const mockAxios = jest.mocked(axios);
const mockLoadedServiceInfo: DatabaseService = {
  dev_api_url: "",
  dev_ui_url: "",
  id: 1,
  is_online: 0,
  label: "",
  logo_filename: "",
  prod_api_url: "",
  prod_ui_url: "",
  service_description: "",
};
const mockRequestAuthenticationChecked = jest
  .spyOn(moduleAuthorization, "requestAuthenticationChecked")
  .mockImplementation(() => true);

const mockRequestValidationError = jest.fn();
const mockBadRequestError = jest.fn();
const mockRequestServerError = jest.fn();
const mockRequestError = getMockRequestError({
  badRequest: mockBadRequestError,
  validation: mockRequestValidationError,
  server: mockRequestServerError,
});

const mockDbGetOneService = mockDb.service.getOneService;

const mockIsFailedQuery = jest
  .spyOn(databaseQuery, "isFailedQueryResult")
  .mockImplementation(() => false);

describe("Controller - Data -> Transferring Route", () => {
  let mockHttpRequest: ExpressRequest;
  const mockHttpRequestBody: DataRequest = {
    apiMethod: "GET",
    apiPath: "/api/test-route",
    serviceId: 1,
  };

  beforeEach(() => {
    mockHttpRequest = getMockReq();
  });

  afterEach(() => {
    mockHttpRequest.destroy();
    mockRequestAuthenticationChecked.mockClear();
    mockRequestError.mockClear();
    mockRequestValidationError.mockClear();
    mockBadRequestError.mockClear();
    mockRequestServerError.mockClear();
    mockAxios.mockClear();
  });

  it("Should fail request due to authentication error", async () => {
    mockRequestAuthenticationChecked.mockImplementationOnce(() => false);
    await DataController.transferRoute(mockHttpRequest);

    expect(mockRequestAuthenticationChecked).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to request body validation error", async () => {
    mockHttpRequest.body = {};
    await DataController.transferRoute(mockHttpRequest);

    expect(mockRequestError).toHaveBeenCalledTimes(1);
    expect(mockRequestValidationError).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to service from request body not existing", async () => {
    mockHttpRequest.body = mockHttpRequestBody;
    mockIsFailedQuery.mockImplementationOnce(() => true);
    await DataController.transferRoute(mockHttpRequest);

    expect(mockRequestError).toHaveBeenCalledTimes(1);
    expect(mockBadRequestError).toHaveBeenCalledTimes(1);
  });

  it("Should fail request due to requested service being offline", async () => {
    mockHttpRequest.body = mockHttpRequestBody;
    mockDbGetOneService.mockImplementationOnce(
      async () =>
        new LoadedService({
          ...mockLoadedServiceInfo,
          is_online: 0,
        })
    );
    await DataController.transferRoute(mockHttpRequest);

    expect(mockRequestError).toHaveBeenCalledTimes(1);
    expect(mockBadRequestError).toHaveBeenCalledTimes(1);
  });

  it("Should succesfully send an api request to an online service", async () => {
    const mockAxiosResponse: Partial<AxiosResponse> = {
      data: "test-data",
    };
    mockHttpRequest.body = mockHttpRequestBody;
    mockDbGetOneService.mockImplementationOnce(
      async () =>
        new LoadedService({
          ...mockLoadedServiceInfo,
          is_online: 1,
        })
    );
    mockAxios.mockImplementationOnce(async () => mockAxiosResponse);
    await DataController.transferRoute(mockHttpRequest);

    expect(mockAxios).toHaveBeenCalledTimes(1);
    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    expect(mockRequestSuccess).toHaveBeenCalledWith(
      mockHttpRequest,
      mockAxiosResponse.data
    );
  });
});
