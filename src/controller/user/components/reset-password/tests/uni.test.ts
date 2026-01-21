import { UserEmail } from "@app-types/user/reset-password";
import { getMockReq } from "@jest-mock/express";
import { getMockRequestError } from "@test-helpers/mocks/mock-request-error";
import { getMockUser } from "@test-helpers/mocks/mock-user";
import { resetPassword } from "@controller/user/components/reset-password";
import { mockDb } from "@test-helpers/mocks/mock-database";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";
import { getMockApprovedPasswordReset } from "@test-helpers/mocks/mock-approved-password-reset";
import { envNames } from "@startup/config";
import { mockEmailService } from "@test-helpers/mocks/mock-email-service";
import { MailOptionsPasswordReset } from "@app-types/email";

describe("Controller - User -> Resetting a user's password", () => {
  const mockHttpRequest = getMockReq();
  const mockUser = getMockUser();
  const mockApprovedPasswordReset = getMockApprovedPasswordReset();
  const serverErrorMessage = "Failed to reset the user's password";
  const baseUiUrl = "fake-base-ui-url";
  const fakeUserSupportEmail = "fake-user-support@fakeEmail.com";

  process.env[envNames.uiBaseUrl.prod] = baseUiUrl;
  process.env[envNames.mail.userSupport] = fakeUserSupportEmail;

  const mockValidationError = jest.fn();
  const mockServerError = jest.fn();
  const mockRequestError = getMockRequestError({
    validation: mockValidationError,
    server: mockServerError,
  });

  mockDb.user.getUserByEmail.mockImplementation(async () => mockUser);

  mockDb.approvedPasswordReset.createApprovedPasswordReset.mockImplementation(
    async () => mockApprovedPasswordReset,
  );

  beforeEach(() => {
    mockHttpRequest.body = <UserEmail>{
      email: mockUser.email,
    };
  });

  afterEach(() => {
    mockValidationError.mockClear();
    mockServerError.mockClear();
    mockRequestError.mockClear();
    mockRequestSuccess.mockClear();
    mockEmailService.sendMail.mockClear();
  });

  it("Should fail due to an invalid request body", async () => {
    mockHttpRequest.body = {};

    await resetPassword(mockHttpRequest);

    expect(mockValidationError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      expect.any(Error),
    );
  });

  it("Should fail due to the requested user for the password reset not existing", async () => {
    mockDb.user.getUserByEmail.mockImplementationOnce(async () => null);

    await resetPassword(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalled();
    expect(mockRequestSuccess).toHaveBeenCalledWith(mockHttpRequest, "");
  });

  it("Should fail due to an error creating an approved password reset for the requested user", async () => {
    mockDb.approvedPasswordReset.createApprovedPasswordReset.mockImplementationOnce(
      async () => null,
    );

    await resetPassword(mockHttpRequest);

    expect(mockServerError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      Error(serverErrorMessage),
    );
  });

  it("Shoudl fail due to an error sending a password reset email to the user", async () => {
    mockEmailService.sendMail.mockImplementationOnce((mailOptions) => {
      throw Error();
    });

    await resetPassword(mockHttpRequest);

    expect(mockEmailService.sendMail).toHaveBeenCalled();
    expect(mockServerError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalled();
    expect(mockRequestError).toHaveBeenCalledWith(
      mockHttpRequest,
      Error(serverErrorMessage),
    );
  });

  it("Should successfuly create a new password reset and send an email to the user", async () => {
    const mockEmailOptions: MailOptionsPasswordReset = {
      from: fakeUserSupportEmail,
      to: mockUser.email,
      subject: "Password Reset",
      template: "password-reset",
      context: {
        pageTitle: "Password Reset",
        userFullName: mockUser.getFullName(),
        userLink: baseUiUrl
          .concat("/update-password?token=")
          .concat(mockApprovedPasswordReset.token),
      },
      attachments: [
        {
          filename: expect.any(String),
          path: expect.any(String),
          cid: "jaycloud-logo",
        },
      ],
    };

    await resetPassword(mockHttpRequest);

    expect(mockEmailService.sendMail).toHaveBeenCalled();
    expect(mockEmailService.sendMail).toHaveBeenCalledWith(
      mockEmailOptions,
      expect.any(Function),
    );
    expect(mockRequestSuccess).toHaveBeenCalled();
    /**
     * The approved password reset mock expiration time should be 15 minutes.
     * If not, then change the amount of minutes below to the same amount set
     * in the approved password reset mock file.
     */
    expect(mockRequestSuccess).toHaveBeenCalledWith(
      mockHttpRequest,
      "15 minutes",
    );
  });
});
