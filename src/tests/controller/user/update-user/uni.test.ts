import { ExpressRequestAndUser } from "@app-types/authorization";
import { RequestErrorMethods } from "@app-types/request-error";
import { UserUpdateData } from "@app-types/user/update-user";
import { updateUser } from "@controller/user/components/update-user";
import { getMockReq } from "@jest-mock/express";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { dbAuth } from "@services/database";
import { getFakePassword, getFakeUserTokenData } from "@services/test-helper";

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

// Mocks database model
jest.mock("@services/database", () => ({
  dbAuth: {
    usersModel: {
      findByIdAndUpdate: jest.fn(),
    },
  },
}));

// Mocks authorization middleware
jest.mock("@middleware/authorization", () => ({
  getRequestUserData: jest.fn(() => ({
    ...getFakeUserTokenData(),
    save: jest.fn(),
    update: jest.fn(),
    generateAccessToken: jest.fn(),
    toPrivateJSON: jest.fn(),
  })),
  requestIsAuthorized: jest.fn(() => true),
}));

// Mocks Request Error handler
jest.mock("@middleware/request-error", () => ({
  RequestError: jest.fn(),
}));

// Mocks Request Success handler
jest.mock("@middleware/request-success", () => ({
  RequestSuccess: jest.fn(),
}));

describe("Route - Users: Updating a user's password", () => {
  let mockRequest: ExpressRequestAndUser;
  let mockRequestSuccess: jest.Mock;
  let mockRequestError: jest.Mock<Partial<RequestErrorMethods>>;
  let mockRequestErrorBadRequest: jest.Mock;
  let mockRequestErrorServer: jest.Mock;
  let mockRequestErrorValidation: jest.Mock;
  let mockUsersFindByIdAndUpdate: jest.SpyInstance;

  beforeEach(() => {
    const fakeUser = getFakeUserTokenData();
    const requestBody: UserUpdateData = {
      firstName: fakeUser.firstName,
      lastName: fakeUser.lastName,
      password: getFakePassword(),
    };
    mockRequest = getMockReq();
    mockRequest.body = requestBody;

    mockRequestSuccess = <jest.Mock>RequestSuccess;

    mockRequestErrorBadRequest = jest.fn();
    mockRequestErrorServer = jest.fn();
    mockRequestErrorValidation = jest.fn();
    mockRequestError = <jest.Mock>RequestError;
    mockRequestError.mockImplementation(() => ({
      server: mockRequestErrorServer,
      validation: mockRequestErrorValidation,
      badRequest: mockRequestErrorBadRequest,
    }));

    mockUsersFindByIdAndUpdate = jest
      .spyOn<any, any>(dbAuth.usersModel, "findByIdAndUpdate")
      .mockReturnValue({
        ...fakeUser,
        generateAccessToken: () => {},
        toPrivateJSON: () => {},
      });
  });

  afterEach(() => {
    mockRequest.destroy();
    mockRequestSuccess.mockClear();
    mockRequestError.mockClear();
    mockRequestErrorBadRequest.mockClear();
    mockRequestErrorServer.mockClear();
    mockRequestErrorValidation.mockClear();
    mockUsersFindByIdAndUpdate.mockRestore();
  });

  it("Should fail request due to a validation error", async () => {
    (<UserUpdateData>mockRequest.body).password = "";

    await updateUser(mockRequest);

    expect(mockRequestErrorValidation).toHaveBeenCalledTimes(1);
    expect(mockRequestError).toHaveBeenCalledWith(
      mockRequest,
      expect.any(Error)
    );
  });

  it("Should fail request due to a bard request error - no user was found", async () => {
    mockUsersFindByIdAndUpdate.mockReturnValueOnce(null);

    await updateUser(mockRequest);

    expect(mockRequestErrorBadRequest).toHaveBeenCalledTimes(1);
    expect(mockRequestError).toHaveBeenCalledWith(
      mockRequest,
      expect.any(Error)
    );
  });

  it("Should fail request due to server error", async () => {
    mockRequestSuccess.mockImplementationOnce(() => {
      throw Error();
    });

    await updateUser(mockRequest);

    expect(mockRequestErrorServer).toHaveBeenCalledTimes(1);
  });

  it("Should pass request successfully", async () => {
    await updateUser(mockRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
  });
});
