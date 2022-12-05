import {
  requestPassedWithSuccess,
  RequestSuccess,
} from "@middleware/request-success";
import { getMockReq, getMockRes } from "@jest-mock/express";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import {
  ExpressRequestSuccess,
  ExtraHeaders,
  RequestSuccessData,
  RequestSuccessFile,
} from "@app-types/request-success";

describe("Middleware - Request Success", () => {
  let mockRequest: ExpressRequest;
  const mockExpressComponents = getMockRes();
  let mockReponse: ExpressResponse;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = getMockReq();
    mockReponse = mockExpressComponents.res;
    mockNext = mockExpressComponents.next;
  });

  afterEach(() => {
    mockRequest.destroy();
    mockExpressComponents.mockClear();
  });

  describe("Request Success Creator", () => {
    it("Should prepare a request to be responded successfully", () => {
      const mockRequestSuccess: ExpressRequestSuccess = mockRequest;
      const resBody: RequestSuccessData = { test: "test" };
      const resHeaders: ExtraHeaders = [
        { headerName: "test", headerValue: "test" },
      ];
      const resFile: RequestSuccessFile = "test";

      RequestSuccess(mockRequestSuccess, resBody, resHeaders, resFile);

      expect(mockRequestSuccess.success?.data).toBe(resBody);
      expect(mockRequestSuccess.success?.headers).toBe(resHeaders);
      expect(mockRequestSuccess.success?.file).toBe(resFile);
    });
  });

  describe("Request Success Handler", () => {
    it("Should make a request pass successfully", () => {
      RequestSuccess(mockRequest, {});
      requestPassedWithSuccess(mockRequest, mockReponse, mockNext);

      expect(mockReponse.send).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(0);
    });

    it("Should make a request pass successfully with a given body", () => {
      const resBody = "Test is working!";

      RequestSuccess(mockRequest, resBody);
      requestPassedWithSuccess(mockRequest, mockReponse, mockNext);

      expect(mockReponse.send).toBeCalledWith(resBody);
      expect(mockReponse.send).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(0);
    });

    it("Should make a request pass successfully with given headers", () => {
      const resHeaderNameAndValue = "test";
      const resHeaders: ExtraHeaders = [
        {
          headerName: resHeaderNameAndValue,
          headerValue: resHeaderNameAndValue,
        },
      ];

      RequestSuccess(mockRequest, {}, resHeaders);
      requestPassedWithSuccess(mockRequest, mockReponse, mockNext);

      expect(mockReponse.setHeader).toBeCalledWith(
        resHeaderNameAndValue,
        resHeaderNameAndValue
      );
      expect(mockReponse.send).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(0);
    });

    it("Should make a request pass successfully with given file", async () => {
      const resFile = "./testFile.txt";

      RequestSuccess(mockRequest, {}, [], resFile);
      requestPassedWithSuccess(mockRequest, mockReponse, mockNext);

      expect(mockReponse.sendFile).toBeCalledWith(resFile);
      expect(mockReponse.sendFile).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(0);
    });

    it("Should move on to next middleware due to non-successful request", () => {
      requestPassedWithSuccess(mockRequest, mockReponse, mockNext);

      expect(mockReponse.send).toHaveBeenCalledTimes(0);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
