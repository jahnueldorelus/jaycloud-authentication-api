import { ExpressRequestAndUser } from "@app-types/authorization";
import { UserUpdateData } from "@app-types/user/update-user";
import { getMockReq } from "@jest-mock/express";
import { getMockUser } from "@test-helpers/mocks/mock-user";
import { updateUser } from "@controller/user/components/update-user";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { mockDb } from "@test-helpers/mocks/mock-database";
import { databaseQuery } from "@services/database/queries";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";
import { getMockRefreshTokenFamily } from "@test-helpers/mocks/mock-refresh-token-family";
import { getMockRefreshToken } from "@test-helpers/mocks/mock-refresh-token";
import { getMockSsoToken } from "@test-helpers/mocks/mock-sso-token";
import { setMockEnvironmentVariables } from "@test-helpers/mocks/mock-process-env";

describe("Controller - User -> Updating a user", () => {
  let mockHttpRequest: ExpressRequestAndUser = getMockReq();
  setMockEnvironmentVariables();
  const mockUserData: UserUpdateData = {
    firstName: "FAKE FIRST NAME",
    lastName: "FAKE LAST NAME",
    password: "FAKE NEW PASSWORD",
  };
  const mockUser = getMockUser();

  const mockValidationError = jest.fn();
  const mockServerError = jest.fn();
  const mockRequestError = getMockRequestError({
    server: mockServerError,
    validation: mockValidationError,
  });

  mockDb.refreshTokenFamily.createFamily.mockImplementation(async () =>
    getMockRefreshTokenFamily(),
  );
  mockDb.refreshToken.createRefreshToken.mockImplementation(async () =>
    getMockRefreshToken(),
  );
  mockDb.ssoToken.createToken.mockImplementation(async () => getMockSsoToken());
  mockDb.user.updateUser.mockImplementation(
    async () =>
      (await mockUser.generateAuthCredentials()) ||
      databaseQuery.createFailedQuery("server-error", null),
  );

  beforeEach(() => {
    mockHttpRequest = getMockReq();
    mockHttpRequest.body = mockUserData;
    mockHttpRequest.token = "fake-user-token";
    mockHttpRequest.user = mockUser;
  });

  afterEach(() => {
    mockServerError.mockClear();
    mockValidationError.mockClear();
    mockRequestError.mockClear();
  });

  it("Should fail the request due to the request's body being invalid", async () => {
    mockHttpRequest.body = { invalidBodyProperty: true };

    await updateUser(mockHttpRequest);

    expect(mockValidationError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      expect.any(Error),
    );
  });

  it("Should fail to update a user's data in the database due to a server error", async () => {
    mockDb.user.updateUser.mockImplementationOnce(async () =>
      databaseQuery.createFailedQuery("server-error", null),
    );

    await updateUser(mockHttpRequest);

    expect(mockDb.user.updateUser).toHaveBeenCalled();
    expect(mockServerError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      Error("Failed to update the account."),
    );
  });

  it("Should successfully update a user", async () => {
    await updateUser(mockHttpRequest);

    expect(mockDb.user.updateUser).toHaveBeenCalled();
    expect(mockRequestSuccess).toHaveBeenCalled();
    expect(mockRequestSuccess).toHaveBeenCalledWith(
      mockHttpRequest,
      mockUser.getPublicInfoJson(),
      expect.any(Array),
      null,
      expect.any(Array),
    );
  });
});
