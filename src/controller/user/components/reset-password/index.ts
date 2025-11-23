import { Request as ExpressRequest } from "express";
import Joi from "joi";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { UserEmail, ValidUserEmail } from "@app-types/user/reset-password";
import { db } from "@services/database";
import { emailService } from "@services/email";
import { envNames } from "@startup/config";
import path from "path";
import { MailOptionsPasswordReset } from "@app-types/email";
import { reqErrorMessages } from "@services/request-error-messages";

// Schema validation
const resetPasswordSchema = Joi.object({
  email: newUserAttributes.email.joiSchema,
});

/**
 * Deterimines if the user's email is valid.
 * @param userEmail The user's email to validate
 */
const validateUserEmail = (userEmail: UserEmail): ValidUserEmail => {
  const { error, value } = resetPasswordSchema.validate(userEmail);

  if (error) {
    return {
      errorMessage: error.message,
      isValid: false,
      validatedValue: undefined,
    };
  } else {
    return { errorMessage: null, isValid: true, validatedValue: value };
  }
};

/**
 * Gets the amount of time before a password reset expires as a string.
 * @param expDate The date the password reset expires
 */
const getTimeWhenPasswordResetExpires = (expDate: Date): string => {
  const newDate = new Date();
  const timeDiffInMilliseconds = Math.abs(
    newDate.getTime() - expDate.getTime()
  );
  const numOfMinBeforeExp = Math.round(timeDiffInMilliseconds / 60000);

  return `${numOfMinBeforeExp} minutes`;
};

/**
 * Creates a temporary token for a password reset.
 * @param req The network request
 */
export const resetPassword = async (req: ExpressRequest): Promise<void> => {
  // The user's info from the request
  const userInfo: UserEmail = req.body;

  // Determines if the user's information is valid
  const { isValid, errorMessage, validatedValue } = validateUserEmail(userInfo);

  // If the user's information is valid
  if (isValid) {
    try {
      const loaderUser = await db.user.getUserByEmail(validatedValue.email);

      if (!loaderUser) {
        throw Error(reqErrorMessages.nonExistentUser);
      }

      const approvedPasswordReset =
        await db.approvedPasswordReset.createApprovedPasswordReset(
          loaderUser.id
        );

      if (!approvedPasswordReset) {
        throw Error();
      }

      const uiBaseUrl =
        <string>process.env[envNames.nodeEnv] === "development"
          ? process.env[envNames.uiBaseUrl.dev]
          : process.env[envNames.uiBaseUrl.prod];
      const authUiResetUrl: string = `${uiBaseUrl}/update-password?token=${approvedPasswordReset.token}`;

      const emailOptions: MailOptionsPasswordReset = {
        from: <string>process.env[envNames.mail.userSupport],
        to: loaderUser.email,
        subject: "Password Reset",
        template: "password-reset",
        context: {
          pageTitle: "Password Reset",
          userFullName: loaderUser.getFullName(),
          userLink: authUiResetUrl,
        },
        attachments: [
          {
            filename: "jaycloud.png",
            path: path.resolve("./src/assets/images/jaycloud.png"),
            cid: "jaycloud-logo",
          },
        ],
      };

      emailService.sendMail(emailOptions, (error) => {
        if (error) {
          throw Error();
        }
      });

      RequestSuccess(
        req,
        getTimeWhenPasswordResetExpires(approvedPasswordReset.expirationDate)
      );
    } catch (error: any) {
      /**
       * A successful request is returned instead of an error. Due to security
       * purposes, the client will not be told that the email they provided
       * doesn't exist.
       */
      if (error.message === reqErrorMessages.nonExistentUser) {
        RequestSuccess(req, "");
      } else {
        // Default error message
        RequestError(
          req,
          Error("Failed to reset the user's password")
        ).server();
      }
    }
  }
  // If the user's information is invalid
  else {
    RequestError(req, Error(errorMessage)).validation();
  }
};
