import { db } from "@services/database";
import { databaseQuery } from "@services/database/queries";
import * as moduleRequestSuccess from "@middleware/request-success";
import * as moduleRequestError from "@middleware/request-error";
import { RequestErrorMethods } from "@app-types/request-error";
import { getMockReq } from "@jest-mock/express";
import { Request as ExpressRequest } from "express";
import { getServiceLogo } from "@controller/service/components/service-logo";
import path from "path";
import { LoadedService } from "@services/database/table-models/loaded-service";

const mockRequestBadRequestError = jest.fn();
const mockRequestServerError = jest.fn();
const mockRequestSuccess = jest.spyOn(moduleRequestSuccess, "RequestSuccess");
const mockRequestError = jest
  .spyOn(moduleRequestError, "RequestError")
  .mockImplementation(
    () =>
      <RequestErrorMethods>{
        badRequest: mockRequestBadRequestError as any,
        server: mockRequestServerError as any,
      }
  );

let mockHttpRequest: ExpressRequest;
const mockGetOneService = jest
  .spyOn(db.service, "getOneService")
  .mockImplementation();
const mockPathResolve = jest.spyOn(path, "resolve").mockImplementation();

describe("Route - Service -> Get Service Logo", () => {
  beforeEach(() => {
    mockHttpRequest = getMockReq();
  });

  afterEach(() => {
    mockRequestError.mockClear();
    mockRequestBadRequestError.mockClear();
    mockRequestServerError.mockClear();
    mockHttpRequest.destroy();
  });

  describe("Should fail to retrieve a service from the database", () => {
    it("Should return a bad request error", async () => {
      mockGetOneService.mockImplementationOnce(async () =>
        databaseQuery.createFailedQuery("invalid-service-id", null)
      );

      await getServiceLogo(mockHttpRequest, 1);

      expect(mockRequestError).toHaveBeenCalledTimes(1);
      expect(mockRequestBadRequestError).toHaveBeenCalledTimes(1);
    });

    it("Should return a server error", async () => {
      mockGetOneService.mockImplementationOnce(async () =>
        databaseQuery.createFailedQuery("server-error", null)
      );

      await getServiceLogo(mockHttpRequest, 1);

      expect(mockRequestError).toHaveBeenCalledTimes(1);
      expect(mockRequestServerError).toHaveBeenCalledTimes(1);
    });
  });

  it("Should successfully retrieve a service logo", async () => {
    const testLoadedService: LoadedService = new LoadedService({
      dev_api_url: "",
      dev_ui_url: "",
      id: 1,
      is_online: 1,
      label: "",
      logo_filename: "test_filename",
      prod_api_url: "",
      prod_ui_url: "",
      service_description: "",
    });
    const testFilenamePath = "src/pictures/" + testLoadedService.logoFilename;

    mockGetOneService.mockImplementationOnce(async () => testLoadedService);
    mockPathResolve.mockReturnValueOnce(testFilenamePath);

    await getServiceLogo(mockHttpRequest, 1);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    expect(mockRequestSuccess).toHaveBeenLastCalledWith(
      mockHttpRequest,
      undefined,
      undefined,
      testFilenamePath
    );
  });
});
