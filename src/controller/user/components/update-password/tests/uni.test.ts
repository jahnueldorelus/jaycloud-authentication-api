import { getMockReq } from "@jest-mock/express";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { UpdatePasswordInfo } from "@app-types/user/update-password";
import { getMockApprovedPasswordReset } from "@test-helpers/mocks/mock-approved-password-reset";
import { updatePassword } from "@controller/user/components/update-password";
import { mockDb } from "@test-helpers/mocks/mock-database";
import { getMockUser } from "@test-helpers/mocks/mock-user";
import { envNames } from "@startup/config";
import { AuthenticatedUserData } from "@services/database/table-models/loaded-user/types";
import { getMockRefreshTokenFamily } from "@test-helpers/mocks/mock-refresh-token-family";
import { getMockRefreshToken } from "@test-helpers/mocks/mock-refresh-token";
import { getMockSsoToken } from "@test-helpers/mocks/mock-sso-token";
import { databaseQuery } from "@services/database/queries";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";

describe("Controller - User -> Updating a user's password", () => {
  process.env[envNames.jwt.privateKey] = "fake-private-key";
  process.env[envNames.jwt.alg] = "HS256";
  process.env[envNames.jwt.accessExpiration] = "7d";

  const serverErrorMessage = "Failed to update the user's password";
  const expiredRequestErrorMessage =
    "The time frame to update the password has expired. Please make another request to update your password.";
  let mockHttpRequest = getMockReq();
  const mockErrorValidation = jest.fn();
  const mockErrorBadRequest = jest.fn();
  const mockErrorServer = jest.fn();
  const mockRequestError = getMockRequestError({
    validation: mockErrorValidation,
    badRequest: mockErrorBadRequest,
    server: mockErrorServer,
  });
  const mockUser = getMockUser();
  const mockAccessToken = mockUser.generateAccessToken();
  const mockRefreshTokenFamily = getMockRefreshTokenFamily();
  const mockRefreshToken = getMockRefreshToken({
    family_id: mockRefreshTokenFamily.token,
  });
  const mockSsoToken = getMockSsoToken();
  const mockApprovedPasswordReset = getMockApprovedPasswordReset();
  const httpRequestBody: UpdatePasswordInfo = {
    password: "fake-user-password",
    token: mockApprovedPasswordReset.token,
  };

  mockDb.approvedPasswordReset.getAprByToken.mockImplementation(
    async () => mockApprovedPasswordReset,
  );
  mockDb.approvedPasswordReset.getUserById.mockImplementation(
    async () => mockUser,
  );
  mockDb.refreshTokenFamily.createFamily.mockImplementation(
    async () => mockRefreshTokenFamily,
  );
  mockDb.refreshToken.createRefreshToken.mockImplementation(
    async () => mockRefreshToken,
  );
  mockDb.ssoToken.createToken.mockImplementation(async () => mockSsoToken);
  mockDb.user.updateUser.mockImplementation(
    async () =>
      <AuthenticatedUserData>{
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        refreshTokenFamily: mockRefreshTokenFamily,
        ssoToken: mockSsoToken,
      },
  );

  beforeEach(() => {
    mockHttpRequest = getMockReq();
    mockHttpRequest.body = httpRequestBody;
  });

  afterEach(() => {
    mockErrorValidation.mockClear();
    mockErrorBadRequest.mockClear();
    mockErrorServer.mockClear();
    mockRequestError.mockClear();
  });

  it("Should fail due to a request validation error", async () => {
    mockHttpRequest.body = {};

    await updatePassword(mockHttpRequest);

    expect(mockErrorValidation).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      expect.any(Error),
    );
  });

  it("Should fail due to the approved password request token not existing", async () => {
    mockDb.approvedPasswordReset.getAprByToken.mockImplementationOnce(
      async () => databaseQuery.createFailedQuery("invalid-token", null),
    );

    await updatePassword(mockHttpRequest);

    expect(mockDb.approvedPasswordReset.getAprByToken).toHaveBeenCalled();
    expect(mockErrorBadRequest).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      Error(expiredRequestErrorMessage),
    );
  });

  it("Should fail due to a server error retrieving the user of an approved password reset", async () => {
    mockDb.approvedPasswordReset.getAprByToken.mockImplementationOnce(
      async () => databaseQuery.createFailedQuery("server-error", null),
    );

    await updatePassword(mockHttpRequest);

    expect(mockDb.approvedPasswordReset.getAprByToken).toHaveBeenCalled();
    expect(mockErrorServer).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      Error(serverErrorMessage),
    );
  });

  it("Should fail due to an error updating the user's password in the database", async () => {
    mockDb.user.updateUser.mockImplementationOnce(async () =>
      databaseQuery.createFailedQuery("server-error", null),
    );

    await updatePassword(mockHttpRequest);

    expect(mockDb.user.updateUser).toHaveBeenCalled();
    expect(mockErrorServer).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      Error(serverErrorMessage),
    );
  });

  it("Should successfully update the user's password", async () => {
    await updatePassword(mockHttpRequest);

    expect(mockDb.approvedPasswordReset.getAprByToken).toHaveBeenCalled();
    expect(mockDb.user.updateUser).toHaveBeenCalled();
    expect(mockRequestSuccess).toHaveBeenCalled();
    expect(mockRequestSuccess).toHaveBeenCalledWith(mockHttpRequest, true);
  });
});
