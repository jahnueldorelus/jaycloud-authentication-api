import { ExpressRequestAndUser } from "@app-types/authorization";
import { getMockReq, getMockRes } from "@jest-mock/express";
import {
  validateRequestAuthorization,
  getRequestUserData,
  requestIsAuthorized,
  requestAuthenticationChecked,
} from "@middleware/authorization";
import { RequestError } from "@middleware/request-error";
import { dbAuth } from "@services/database";
import { getFakeRequestToken, getFakeRequestUser } from "@services/test-helper";
import {
  NextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { verify } from "jsonwebtoken";

// Mocks the Request Error middleware
jest.mock("@middleware/request-error", () => ({
  RequestError: jest.fn(() => ({
    notAuthorized: jest.fn(),
  })),
}));

// Mocks Joi validation
jest.mock("joi", () => ({
  ...jest.requireActual("joi"),
  object: jest.fn(() => ({
    validate: jest.fn((shouldReturnError: boolean) =>
      shouldReturnError ? { error: true } : { error: false }
    ),
  })),
}));

// Mocks JSON Web Token verification
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

// Mocks database user's model find by id method
jest.mock("@services/database", () => ({
  dbAuth: {
    usersModel: {
      findOne: jest.fn(),
    },
  },
}));

// Mocks database connection
jest.mock("mongoose", () => ({
  connection: {
    startSession: () => ({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      inTransaction: jest.fn(() => true),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
  },
}));

describe("Middleware - Authorization", () => {
  const mockExpressComponents = getMockRes();
  let mockRequest: ExpressRequest;
  let mockResponse: ExpressResponse;
  let mockNext: NextFunction;
  let mockRequestError: jest.Mock;
  let mockJwtVerify: jest.Mock;
  let mockDbAuthFindUser: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    mockRequest = getMockReq();
    mockRequest.token = "test_token";
    mockResponse = mockExpressComponents.res;
    mockNext = mockExpressComponents.next;

    mockRequestError = <jest.Mock>RequestError;

    mockJwtVerify = <jest.Mock>verify;
    mockJwtVerify.mockImplementation(() => false);

    mockDbAuthFindUser = <jest.Mock>dbAuth.usersModel.findOne;
    mockDbAuthFindUser.mockResolvedValue(true);
  });

  afterEach(() => {
    mockRequest.destroy();
    mockExpressComponents.mockClear();
    mockRequestError.mockClear();
    mockJwtVerify.mockClear();
    mockDbAuthFindUser.mockClear();
  });

  describe("Authorized Request Validation", () => {
    it("Should pass request due to no token provided", async () => {
      delete mockRequest.token;

      await validateRequestAuthorization(mockRequest, mockResponse, mockNext);

      expect(RequestError).toHaveBeenCalledTimes(0);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("Should fail request due to invalid JWT token", async () => {
      mockJwtVerify.mockImplementation(() => {
        throw Error();
      });

      await validateRequestAuthorization(mockRequest, mockResponse, mockNext);

      expect(mockJwtVerify).toHaveBeenCalledTimes(1);
      expect(RequestError).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("Should fail request due to invalid schema from JWT token", async () => {
      mockJwtVerify.mockImplementation(() => true);

      await validateRequestAuthorization(mockRequest, mockResponse, mockNext);

      expect(mockJwtVerify).toHaveBeenCalledTimes(1);
      expect(RequestError).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("Should fail request due to nonexistent user", async () => {
      mockDbAuthFindUser.mockImplementation(() => false);
      await validateRequestAuthorization(mockRequest, mockResponse, mockNext);

      expect(mockDbAuthFindUser).toHaveBeenCalledTimes(1);
      expect(RequestError).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("Should pass request due to valid token and existing user", async () => {
      await validateRequestAuthorization(mockRequest, mockResponse, mockNext);

      expect(RequestError).toHaveBeenCalledTimes(0);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("Retrieving user data from a request", () => {
    let mockRequest: ExpressRequestAndUser;

    beforeEach(() => {
      mockRequest = getMockReq();
    });

    afterEach(() => {
      mockRequest.destroy();
    });

    it("Should return the user from the request", () => {
      // The type of request user and fake user are not the same but it's okay for testing purposes
      const reqUser = getFakeRequestUser();
      mockRequest.user = <typeof mockRequest.user>reqUser;

      const userFromRequest = getRequestUserData(mockRequest);

      expect(userFromRequest).toBe(reqUser);
    });

    it("Should return no user from the request", () => {
      const userFromRequest = getRequestUserData(mockRequest);

      expect(userFromRequest).toBeNull();
    });
  });

  describe("Determines if a request can be processed", () => {
    let mockRequest: ExpressRequestAndUser;

    beforeEach(() => {
      mockRequest = getMockReq();
    });

    afterEach(() => {
      mockRequest.destroy();
    });

    it("Should conclude the request to be authorized", () => {
      // The type of request user and fake user are not the same but it's okay for testing purposes
      mockRequest.user = <typeof mockRequest.user>getFakeRequestUser();
      mockRequest.token = getFakeRequestToken();

      const isReqAuthorized = requestAuthenticationChecked(mockRequest);

      expect(isReqAuthorized).toBeTruthy();
    });

    it("Should conclude the request to be unauthorized", () => {
      mockRequest.token = getFakeRequestToken();

      const isReqAuthorized = requestAuthenticationChecked(mockRequest);

      expect(isReqAuthorized).toBeFalsy();
    });
  });

  describe("Determes if a request is authorized", () => {
    let mockRequest: ExpressRequestAndUser;

    beforeEach(() => {
      mockRequest = getMockReq();
    });

    afterEach(() => {
      mockRequest.destroy();
    });

    it("Should conclude the request to be unauthorized due to no tokenn", () => {
      // The type of request user and fake user are not the same but it's okay for testing purposes
      mockRequest.user = <typeof mockRequest.user>getFakeRequestUser();

      const isReqAuthorized = requestIsAuthorized(mockRequest);

      expect(isReqAuthorized).toBeFalsy();
    });

    it("Should conclude the request to be unauthorized due to no user", () => {
      mockRequest.token = getFakeRequestToken();

      const isReqAuthorized = requestIsAuthorized(mockRequest);

      expect(isReqAuthorized).toBeFalsy();
    });

    it("Should conclude the request to be authorized", () => {
      mockRequest.user = <typeof mockRequest.user>getFakeRequestUser();
      mockRequest.token = getFakeRequestToken();

      const isReqAuthorized = requestIsAuthorized(mockRequest);

      expect(isReqAuthorized).toBeTruthy();
    });
  });
});
