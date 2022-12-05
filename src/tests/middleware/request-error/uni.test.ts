import {
  RequestError,
  requestFailedWithError,
} from "@middleware/request-error";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { ExpressRequestError } from "@app-types/request-error";
import { Response as ExpressResponse } from "express";
import { StatusCodes } from "http-status-codes";
import { reqErrorMessages } from "@services/request-error-messages";

describe("Middleware - Request Error", () => {
  describe("Request Error Handler", () => {
    let mockResponse: ExpressResponse;
    let mockRequest: ExpressRequestError;

    beforeEach(() => {
      mockRequest = getMockReq();
      mockResponse = getMockRes().res;
    });

    afterEach(() => {
      mockRequest.destroy();
      mockResponse.end();
    });

    it("Should give a bad request error response", () => {
      RequestError(mockRequest, Error()).badRequest();
      requestFailedWithError(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalledWith(
        reqErrorMessages.badRequest
      );
    });

    it("Should give an unauthorized error response", () => {
      RequestError(mockRequest, Error()).notAuthorized();
      requestFailedWithError(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(
        StatusCodes.UNAUTHORIZED
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        reqErrorMessages.forbiddenUser
      );
    });

    it("Should give a forbidden error response", () => {
      RequestError(mockRequest, Error()).forbidden();
      requestFailedWithError(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(mockResponse.send).toHaveBeenCalledWith(
        reqErrorMessages.forbiddenUser
      );
    });

    it("Should give a validation error response", () => {
      RequestError(mockRequest, Error()).validation();
      requestFailedWithError(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalledWith(
        reqErrorMessages.validationFail
      );
    });

    it("Should give a server error response", () => {
      requestFailedWithError(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        reqErrorMessages.serverError
      );
    });
  });

  describe("Request Error Creation", () => {
    // The mock request
    let mockRequest: ExpressRequestError;
    // Custom error message
    const customErrMessage = "Uh-oh, I failed!";

    // Creates a mock Express server request
    beforeEach(() => {
      mockRequest = getMockReq();
    });

    // Destroys the mock Express server request
    afterEach(() => {
      if (mockRequest) mockRequest.destroy();
    });

    it("Should create a bad request (With both default and custom message)", () => {
      // Creates an error on the request (DEFAULT MESSAGE)
      RequestError(mockRequest, Error()).badRequest();
      // Expected Results
      expect(mockRequest.failed?.status).toBe(StatusCodes.BAD_REQUEST);
      expect(mockRequest.failed?.errorMessage).toBe(
        reqErrorMessages.badRequest
      );
      // Creates an error on the request (CUSTOM MESSAGE)
      RequestError(mockRequest, Error(customErrMessage)).badRequest();
      // Expected Results
      expect(mockRequest.failed?.status).toBe(StatusCodes.BAD_REQUEST);
      expect(mockRequest.failed?.errorMessage).toBe(customErrMessage);
    });

    it("Should create an unauthorized request", () => {
      // Creates an error on the request (DEFAULT MESSAGE)
      RequestError(mockRequest, Error()).notAuthorized();
      // Expected Results
      expect(mockRequest.failed?.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(mockRequest.failed?.errorMessage).toBe(
        reqErrorMessages.forbiddenUser
      );
      // Creates an error on the request (CUSTOM MESSAGE)
      RequestError(mockRequest, Error(customErrMessage)).notAuthorized();
      // Expected Results
      expect(mockRequest.failed?.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(mockRequest.failed?.errorMessage).toBe(customErrMessage);
    });

    it("Should create a forbidden request", () => {
      // Creates an error on the request (DEFAULT MESSAGE)
      RequestError(mockRequest, Error()).forbidden();
      // Expected Results
      expect(mockRequest.failed?.status).toBe(StatusCodes.FORBIDDEN);
      expect(mockRequest.failed?.errorMessage).toBe(
        reqErrorMessages.forbiddenUser
      );
      // Creates an error on the request (CUSTOM MESSAGE)
      RequestError(mockRequest, Error(customErrMessage)).forbidden();
      // Expected Results
      expect(mockRequest.failed?.status).toBe(StatusCodes.FORBIDDEN);
      expect(mockRequest.failed?.errorMessage).toBe(customErrMessage);
    });

    it("Should create an invalid validation request", () => {
      // Creates an error on the request (DEFAULT MESSAGE)
      RequestError(mockRequest, Error()).validation();
      // Expected Results
      expect(mockRequest.failed?.status).toBe(StatusCodes.BAD_REQUEST);
      expect(mockRequest.failed?.errorMessage).toBe(
        reqErrorMessages.validationFail
      );
      // Creates an error on the request (CUSTOM MESSAGE)
      RequestError(mockRequest, Error(customErrMessage)).validation();
      // Expected Results
      expect(mockRequest.failed?.status).toBe(StatusCodes.BAD_REQUEST);
      expect(mockRequest.failed?.errorMessage).toContain(customErrMessage);
    });

    it("Should create a server error request", () => {
      // Creates an error on the request (DEFAULT MESSAGE)
      RequestError(mockRequest, Error()).server();
      // Expected Results
      expect(mockRequest.failed?.status).toBe(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
      expect(mockRequest.failed?.errorMessage).toBe(
        reqErrorMessages.serverError
      );
      // Creates an error on the request (CUSTOM MESSAGE)
      RequestError(mockRequest, Error(customErrMessage)).server();
      // Expected Results
      expect(mockRequest.failed?.status).toBe(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
      expect(mockRequest.failed?.errorMessage).toBe(customErrMessage);
    });
  });
});
