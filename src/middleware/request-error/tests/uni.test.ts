import { getMockReq, getMockRes } from "@jest-mock/express";
import { setMockEnvironmentVariables } from "@test-helpers/mocks/mock-process-env";
import {
  RequestError,
  requestFailedWithError,
} from "@middleware/request-error";
import { StatusCodes } from "http-status-codes";
import { reqErrorMessages } from "@services/request-error-messages";
import { ExpressRequestError } from "@app-types/request-error";
import { CookieRemoval } from "@app-types/request-success";
import { envNames } from "@startup/config";

setMockEnvironmentVariables();

describe("Middleare - Request Error", () => {
  let mockRequest: ExpressRequestError = getMockReq();
  let mockResponse = getMockRes();

  beforeEach(() => {
    mockRequest = getMockReq();
    mockResponse = getMockRes();
  });

  describe("Handling failed requests", () => {
    it("Should return a server error whens no request error is found and no response has been sent", () => {
      requestFailedWithError(mockRequest, mockResponse.res);

      expect(mockResponse.res.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.res.send).toHaveBeenCalledWith(
        reqErrorMessages.serverError,
      );
    });

    it("Should find a request error, remove all cookies asked to be removed if any, and return the found error", () => {
      const cookiesToRemove: CookieRemoval[] = [
        { key: "cookie-one" },
        { key: "cookie-two" },
        { key: "cookie-three" },
      ];
      const resposneErrorMessage = "you-fail-now-please";

      RequestError(
        mockRequest,
        Error(resposneErrorMessage),
        cookiesToRemove,
      ).badRequest();

      const requestOriginDomain = <string>process.env[envNames.origins.domain];

      requestFailedWithError(mockRequest, mockResponse.res);

      expect(mockResponse.res.clearCookie).toHaveBeenCalledTimes(
        cookiesToRemove.length,
      );
      cookiesToRemove.forEach((cookie) => {
        expect(mockResponse.res.clearCookie).toHaveBeenCalledWith(cookie.key, {
          domain: requestOriginDomain,
        });
      });
      expect(mockResponse.res.status).toHaveBeenCalledWith(
        StatusCodes.BAD_REQUEST,
      );
      expect(mockResponse.res.send).toHaveBeenCalledWith(resposneErrorMessage);
    });
  });

  describe("Creating a failed request error", () => {
    afterEach(() => {
      expect(mockRequest.failed).not.toBeNull();
    });

    describe("Bad request error", () => {
      it("Should create the error with the default message", () => {
        RequestError(mockRequest, Error()).badRequest();

        expect(mockRequest.failed?.errorMessage).toBe(
          reqErrorMessages.badRequest,
        );
        expect(mockRequest.failed?.status).toBe(StatusCodes.BAD_REQUEST);
      });

      it("Should create the error with a custom message", () => {
        const customErrorMessage = "Ya done did it! You poked the bear!";
        RequestError(mockRequest, Error(customErrorMessage)).badRequest();

        expect(mockRequest.failed?.errorMessage).toBe(customErrorMessage);
        expect(mockRequest.failed?.status).toBe(StatusCodes.BAD_REQUEST);
      });
    });

    describe("Not authorized error", () => {
      it("Should create the error with the default message", () => {
        RequestError(mockRequest, Error()).notAuthorized();

        expect(mockRequest.failed?.errorMessage).toBe(
          reqErrorMessages.forbiddenUser,
        );
        expect(mockRequest.failed?.status).toBe(StatusCodes.UNAUTHORIZED);
      });

      it("Should create the error with a custom message", () => {
        const errorMessage = "You cannot access this. Leave me alone!";
        RequestError(mockRequest, Error(errorMessage)).notAuthorized();

        expect(mockRequest.failed?.errorMessage).toBe(errorMessage);
        expect(mockRequest.failed?.status).toBe(StatusCodes.UNAUTHORIZED);
      });
    });

    describe("Forbidden error", () => {
      it("Should create the error with the default message", () => {
        RequestError(mockRequest, Error()).forbidden();

        expect(mockRequest.failed?.errorMessage).toBe(
          reqErrorMessages.forbiddenUser,
        );
        expect(mockRequest.failed?.status).toBe(StatusCodes.FORBIDDEN);
      });

      it("Should create the error with a custom message", () => {
        const errorMessage =
          "How dare you touch that! I'm placing you under arrest!";
        RequestError(mockRequest, Error(errorMessage)).forbidden();

        expect(mockRequest.failed?.errorMessage).toBe(errorMessage);
        expect(mockRequest.failed?.status).toBe(StatusCodes.FORBIDDEN);
      });
    });

    describe("Validation error", () => {
      it("Should create the error with the default message", () => {
        RequestError(mockRequest, Error()).validation();

        expect(mockRequest.failed?.errorMessage).toContain(
          reqErrorMessages.validationFail,
        );
        expect(mockRequest.failed?.status).toBe(StatusCodes.BAD_REQUEST);
      });

      it("Should create the error with a custom message", () => {
        const errorMessage = "Hmm, you don't seem legit. You IMPOSTER!";
        RequestError(mockRequest, Error(errorMessage)).validation();

        expect(mockRequest.failed?.errorMessage).toContain(errorMessage);
        expect(mockRequest.failed?.status).toBe(StatusCodes.BAD_REQUEST);
      });
    });

    describe("Server error", () => {
      it("Should create the error with the default message", () => {
        RequestError(mockRequest, Error()).server();

        expect(mockRequest.failed?.errorMessage).toContain(
          reqErrorMessages.serverError,
        );
        expect(mockRequest.failed?.status).toBe(
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      });

      it("Should create the error with a custom message", () => {
        const errorMessage = "Ohhh nooo, I done messed up!";
        RequestError(mockRequest, Error(errorMessage)).server();

        expect(mockRequest.failed?.errorMessage).toContain(errorMessage);
        expect(mockRequest.failed?.status).toBe(
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      });
    });
  });
});
