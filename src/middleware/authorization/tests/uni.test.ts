import { getMockReq, getMockRes } from "@jest-mock/express";
import { setMockEnvironmentVariables } from "@test-helpers/mocks/mock-process-env";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import {
  getRequestUserData,
  requestAfterAuthCanBeProcessed,
  requestIsAuthorized,
  validateRequestAuthorization,
  validateSSOReqAuthorization,
} from "@middleware/authorization";
import { reqErrorMessages } from "@services/request-error-messages";
import { getMockUser } from "@test-helpers/mocks/mock-user";
import { mockDb } from "@test-helpers/mocks/mock-database";
import { ExpressRequestAndUser, SSOToken } from "@app-types/authorization";
import { databaseQuery } from "@services/database/queries";
import { AES } from "crypto-js";
import { LoadedSsoToken } from "@services/database/table-models/loaded-sso-token";
import { verify } from "jsonwebtoken";
import { envNames } from "@startup/config";
import { LoadedUser } from "@services/database/table-models/loaded-user";

setMockEnvironmentVariables();

describe("Middleare - Authorization", () => {
  let mockRequest: ExpressRequestAndUser = getMockReq();
  let mockResponse = getMockRes();
  const mockUser = getMockUser();
  const requestHeaderSsoKey = "sso-token";
  const mockSsoTokenValue: SSOToken = { token: "".padEnd(36, "X") };

  const mockErrorUnauthorized = jest.fn();
  const mockErrorServer = jest.fn();
  const mockRequestError = getMockRequestError({
    notAuthorized: mockErrorUnauthorized,
    server: mockErrorServer,
  });
  const mockAESDecrypt = jest.spyOn(AES, "decrypt").mockReturnValue({
    toString: () => mockSsoTokenValue.token,
  } as CryptoJS.lib.WordArray);

  mockDb.ssoToken.getToken.mockImplementation(
    async () =>
      new LoadedSsoToken(
        {
          expiration_date: new Date().toString(),
          sso_key: mockSsoTokenValue.token,
          user_id: mockUser.id,
        },
        () => "fake-encrypt-decrypt-key", // Mock function for retrieving encrypt/decrypt key,
      ),
  );
  mockDb.user.getUserById.mockImplementation(async () => mockUser);
  mockDb.user.getUserByEmail.mockImplementation(async () => mockUser);

  beforeEach(() => {
    mockRequest = getMockReq();
    mockRequest.body = mockSsoTokenValue;
    mockRequest.headers[requestHeaderSsoKey] = mockSsoTokenValue.token;
    mockDb.ssoToken.getToken.mockClear();
    mockDb.user.getUserById.mockClear();
    mockDb.user.getUserByEmail.mockClear();
    mockResponse = getMockRes();
    mockRequestError.mockClear();
    mockErrorUnauthorized.mockClear();
    mockAESDecrypt.mockClear();
  });

  describe("Authorization via JWT", () => {
    it("Should fail the request due to no token being provided with the request", async () => {
      await validateRequestAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      expect(mockRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqErrorMessages.invalidToken),
      );
      expect(mockErrorUnauthorized).toHaveBeenCalled();
      expect(mockResponse.next).toHaveBeenCalled();
    });

    it("Should fail the request due to the provided JWT token being invalid", async () => {
      mockRequest.token = "fake-JWT-token";

      await validateRequestAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      expect(mockRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqErrorMessages.invalidToken),
      );
      expect(mockErrorUnauthorized).toHaveBeenCalled();
      expect(mockResponse.next).toHaveBeenCalled();
    });

    it("Should fail the request due to the user provided in the JWT token not existing", async () => {
      mockDb.user.getUserByEmail.mockImplementationOnce(async () => null);
      mockRequest.token = mockUser.generateAccessToken();

      await validateRequestAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      expect(mockRequestError).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqErrorMessages.nonExistentUser),
      );
      expect(mockErrorUnauthorized).toHaveBeenCalled();
      expect(mockResponse.next).toHaveBeenCalled();
    });

    it("Should successfully authorize the request and set the user's info retrieved from the database into the request", async () => {
      mockDb.user.getUserByEmail.mockImplementationOnce(async () => mockUser);
      mockRequest.token = mockUser.generateAccessToken();

      await validateRequestAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      expect(mockRequest.user).toBe(mockUser);
      expect(mockResponse.next).toHaveBeenCalled();
    });
  });

  /**
   *
   *
   */
  describe("Validating SSO Request Authorization", () => {
    it("Should fail the request due to SSO token validation errors in request body", async () => {
      delete mockRequest.body;

      await validateSSOReqAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      expect(mockRequestError).toHaveBeenCalled();
      expect(mockErrorUnauthorized).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqErrorMessages.invalidToken),
      );
    });

    it("Should fail the request due to no SSO token provided in the signed cookies or request headers", async () => {
      delete mockRequest.headers[requestHeaderSsoKey];

      await validateSSOReqAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      expect(mockRequestError).toHaveBeenCalled();
      expect(mockErrorUnauthorized).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqErrorMessages.invalidToken),
      );
    });

    describe("Expected possible errors when retrieving SSO token from the databse", () => {
      it("Should fail due to the SSO token provided not existing in the database", async () => {
        mockDb.ssoToken.getToken.mockImplementationOnce(async () =>
          databaseQuery.createFailedQuery("invalid-request", null),
        );

        await validateSSOReqAuthorization(
          mockRequest,
          mockResponse.res,
          mockResponse.next,
        );

        expect(mockRequestError).toHaveBeenCalled();
        expect(mockErrorUnauthorized).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalledWith(
          mockRequest,
          Error(reqErrorMessages.invalidToken),
        );
      });

      it("Should fail due to a server error", async () => {
        mockDb.ssoToken.getToken.mockImplementationOnce(async () =>
          databaseQuery.createFailedQuery("server-error", null),
        );

        await validateSSOReqAuthorization(
          mockRequest,
          mockResponse.res,
          mockResponse.next,
        );

        expect(mockRequestError).toHaveBeenCalled();
        expect(mockErrorServer).toHaveBeenCalled();
        expect(mockRequestError).toHaveBeenCalledWith(
          mockRequest,
          Error(reqErrorMessages.serverError),
        );
      });
    });

    it("Should fail due to error decrypting SSO token", async () => {
      mockAESDecrypt.mockReturnValueOnce({
        toString: () => "fraud-token",
      } as CryptoJS.lib.WordArray);

      await validateSSOReqAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      expect(mockAESDecrypt).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalled();
      expect(mockErrorUnauthorized).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqErrorMessages.invalidToken),
      );
    });

    it("Should fail due to user of SSO token not existing", async () => {
      mockDb.user.getUserById.mockImplementationOnce(async () => null);

      await validateSSOReqAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      expect(mockDb.user.getUserById).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalled();
      expect(mockErrorUnauthorized).toHaveBeenCalled();
      expect(mockRequestError).toHaveBeenCalledWith(
        mockRequest,
        Error(reqErrorMessages.forbiddenUser),
      );
    });

    it("Should succesfully validate SSO request", async () => {
      expect(mockRequest.token).toBeUndefined();

      await validateSSOReqAuthorization(
        mockRequest,
        mockResponse.res,
        mockResponse.next,
      );

      const jwtSigningKey = <string>process.env[envNames.jwt.privateKey];

      expect(mockRequest.token).toBeDefined();

      if (mockRequest.token) {
        expect(verify(mockRequest.token, jwtSigningKey));
      }
    });
  });

  describe("Retrieving user data from request", () => {
    it("Should fail to retrieve the user's data", () => {
      const reqUserData = getRequestUserData(mockRequest);

      expect(reqUserData).toBeUndefined();
    });

    it("Should successfully retrieve the user's data", () => {
      mockRequest.user = mockUser;

      const reqUserData = getRequestUserData(mockRequest);

      expect(reqUserData).not.toBeNull();
      expect(reqUserData instanceof LoadedUser).toBe(true);
    });
  });

  describe("Validating Authorization of Rquest", () => {
    describe("Should fail to be authorized", () => {
      it("Should fail due to no access token or user present", () => {
        const reqIsAuthorized = requestIsAuthorized(mockRequest);

        expect(reqIsAuthorized).toBe(false);
      });

      it("Should fail due to no access token present", () => {
        mockRequest.user = mockUser;

        const reqIsAuthorized = requestIsAuthorized(mockRequest);

        expect(reqIsAuthorized).toBe(false);
      });

      it("Should fail due to no user present", () => {
        mockRequest.token = mockUser.generateAccessToken();

        const reqIsAuthorized = requestIsAuthorized(mockRequest);

        expect(reqIsAuthorized).toBe(false);
      });
    });

    it("Should successfully be authorized", () => {
      mockRequest.user = mockUser;
      mockRequest.token = mockUser.generateAccessToken();

      const reqIsAuthorized = requestIsAuthorized(mockRequest);

      expect(reqIsAuthorized).toBe(true);
    });
  });

  describe("Validating Authorized Processing of Request", () => {
    it("Should not allow a request to be processed", () => {
      mockRequest.token = mockUser.generateAccessToken();

      const canProcessRequest = requestAfterAuthCanBeProcessed(mockRequest);

      expect(canProcessRequest).toBe(false);
    });

    describe("Should allow request to be processed", () => {
      it("Should allow request with no token or user", () => {
        const canProcessRequest = requestAfterAuthCanBeProcessed(mockRequest);

        expect(canProcessRequest).toBe(true);
      });

      it("Should allow request with no token", () => {
        mockRequest.user = mockUser;

        const canProcessRequest = requestAfterAuthCanBeProcessed(mockRequest);

        expect(canProcessRequest).toBe(true);
      });

      it("Should allow request with token and user", () => {
        mockRequest.user = mockUser;
        mockRequest.token = mockUser.generateAccessToken();

        const canProcessRequest = requestAfterAuthCanBeProcessed(mockRequest);

        expect(canProcessRequest).toBe(true);
      });
    });
  });
});
