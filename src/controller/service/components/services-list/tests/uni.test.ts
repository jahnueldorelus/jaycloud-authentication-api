import { db } from "@services/database";
import { databaseQuery } from "@services/database/queries";
import { getMockReq } from "@jest-mock/express";
import { Request as ExpressRequest } from "express";
import { getServices } from "@controller/service/components/services-list";
import { LoadedService } from "@services/database/table-models/loaded-service";
import { ServicePublicData } from "@services/database/table-models/loaded-service/types";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";

const mockRequestServerError = jest.fn();
const mockRequestError = getMockRequestError({
  server: mockRequestServerError,
});

let mockHttpRequest: ExpressRequest;
const mockGetListOfServices = jest
  .spyOn(db.service, "getListOfServices")
  .mockImplementation();

describe("Controller - Service -> Get List of Services", () => {
  beforeEach(() => {
    mockHttpRequest = getMockReq();
  });

  afterEach(() => {
    mockRequestError.mockClear();
    mockRequestServerError.mockClear();
    mockHttpRequest.destroy();
  });

  it("Should return a server error", async () => {
    mockGetListOfServices.mockImplementationOnce(async () =>
      databaseQuery.createFailedQuery("server-error", null)
    );

    await getServices(mockHttpRequest);

    expect(mockRequestError).toHaveBeenCalledTimes(1);
    expect(mockRequestServerError).toHaveBeenCalledTimes(1);
  });

  it("Should successfully retrieve the list of services", async () => {
    const prodAndDevUiUrl = "";
    const prodAndDevApiUrl = "";
    const testLoadedService: LoadedService = new LoadedService({
      dev_api_url: prodAndDevApiUrl,
      dev_ui_url: prodAndDevUiUrl,
      id: 1,
      is_online: 1,
      label: "",
      logo_filename: "test_filename",
      prod_api_url: prodAndDevApiUrl,
      prod_ui_url: prodAndDevUiUrl,
      service_description: "",
    });

    const loadedServicePublicData: ServicePublicData =
      testLoadedService.getPublicInfoJson();

    mockGetListOfServices.mockImplementationOnce(async () => [
      testLoadedService,
    ]);

    await getServices(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    expect(mockRequestSuccess).toHaveBeenLastCalledWith(mockHttpRequest, [
      loadedServicePublicData,
    ]);
  });
});
