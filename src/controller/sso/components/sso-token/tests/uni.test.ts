import { getMockReq } from "@jest-mock/express";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { getSSOToken } from "@controller/sso/components/sso-token";
import { mockDb } from "@test-helpers/mocks/mock-database";
import { databaseQuery } from "@services/database/queries";
import { envNames } from "@startup/config";
import { getMockSsoToken } from "@test-helpers/mocks/mock-sso-token";
import { SSOTokenResponse } from "@app-types/sso";
import { AES } from "crypto-js";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";
import { CookieRemoval } from "@app-types/request-success";

const mockHttpRequest = getMockReq();
const ssoTokenCookieKey = <string>process.env[envNames.cookie.ssoId];

describe("Controller - SSO - Get the user's SSO token", () => {
  describe("Should fail the request due to an error", () => {
    const mockRequestErrorBadRequest = jest.fn();
    const mockRequestErrorForbiddenUser = jest.fn();
    const mockRequestErrorServerError = jest.fn();
    const mockRequestError = getMockRequestError({
      badRequest: mockRequestErrorBadRequest,
      forbidden: mockRequestErrorForbiddenUser,
      server: mockRequestErrorServerError,
    });

    beforeEach(() => {
      mockHttpRequest.signedCookies[ssoTokenCookieKey] =
        "fake-encrypted-sso-token";
    });

    afterEach(() => {
      mockRequestError.mockClear();
      mockRequestErrorBadRequest.mockClear();
      mockRequestErrorForbiddenUser.mockClear();
      mockRequestErrorServerError.mockClear();
      mockRequestSuccess.mockClear();
    });

    describe("Should fail due to a server error", () => {
      it("An error should occur due to a database issue", async () => {
        mockDb.ssoToken.getToken.mockImplementationOnce(async () =>
          databaseQuery.createFailedQuery("server-error", null)
        );

        await getSSOToken(mockHttpRequest);

        expect(mockRequestError).toHaveBeenCalledTimes(1);
        expect(mockRequestErrorServerError).toHaveBeenCalledTimes(1);
      });

      it("An error should occur while trying to decrypt the user's encrypted SSO token", async () => {
        mockDb.ssoToken.getToken.mockImplementationOnce(async () =>
          getMockSsoToken({}, () => null)
        );

        await getSSOToken(mockHttpRequest);

        expect(mockRequestError).toHaveBeenCalledTimes(1);
        expect(mockRequestErrorServerError).toHaveBeenCalledTimes(1);
      });
    });

    it("Should fail due to a bad request error from the request not having valid cookies", async () => {
      mockHttpRequest.signedCookies[ssoTokenCookieKey] = null;

      await getSSOToken(mockHttpRequest);

      expect(mockRequestError).toHaveBeenCalledTimes(1);
      expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
    });

    it("Should fail due to an unauthorized error from the request given SSO token not existing in the database", async () => {
      mockDb.ssoToken.getToken.mockImplementationOnce(async () =>
        databaseQuery.createFailedQuery("invalid-request", null)
      );

      await getSSOToken(mockHttpRequest);

      expect(mockRequestError).toHaveBeenCalledTimes(1);
      expect(mockRequestErrorForbiddenUser).toHaveBeenCalledTimes(1);
    });
  });

  it("Should successfully retrieve the user's decrypted sso token", async () => {
    const testDecryptionKey = "test-decryption-key";
    const mockDecryptedSsoToken = "mock-decrypted-sso-token";

    const mockSsoToken = getMockSsoToken(
      {
        sso_key: AES.encrypt(
          mockDecryptedSsoToken,
          testDecryptionKey
        ).toString(),
      },
      () => testDecryptionKey
    );

    mockDb.ssoToken.getToken.mockImplementationOnce(async () => mockSsoToken);

    const requestResponse: SSOTokenResponse = {
      token: mockDecryptedSsoToken,
    };
    const authReqCookieKey = <string>(
      process.env[envNames.cookie.initialAuthReq]
    );
    const listOfCookiesToRemove: CookieRemoval[] = [
      {
        key: authReqCookieKey,
      },
    ];

    await getSSOToken(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
    expect(mockRequestSuccess).toHaveBeenCalledWith(
      mockHttpRequest,
      requestResponse,
      null,
      null,
      null,
      listOfCookiesToRemove
    );
  });
});
