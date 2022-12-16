import { Request as ExpressRequest } from "express";
import Joi from "joi";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { connection } from "mongoose";
import { UserEmail, ValidUserEmail } from "@app-types/user/reset-password";
import { dbAuth } from "@services/database";
import { emailService } from "@services/email";
import { envNames } from "@startup/config";
import path from "path";
import { MailOptionsPasswordReset } from "@app-types/email";

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
  return {
    isValid: error ? false : true,
    errorMessage: error ? error.message : null,
    validatedValue: value,
  };
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
    const dbSession = await connection.startSession();

    try {
      dbSession.startTransaction();

      const user = await dbAuth.usersModel.findOne(
        {
          email: validatedValue.email,
        },
        null,
        { session: dbSession }
      );

      if (user) {
        const approvedPasswordReset =
          await dbAuth.approvedPasswordResetModel.createApprovedPasswordReset(
            user.id,
            dbSession
          );
        await dbSession.commitTransaction();

        if (!approvedPasswordReset) {
          throw Error();
        }

        const getUserLink = () => {
          const uiBaseUrl =
            <string>process.env[envNames.nodeEnv] === "development"
              ? process.env[envNames.uiBaseUrl.dev]
              : process.env[envNames.uiBaseUrl.prod];

          return `${uiBaseUrl}?reset=${approvedPasswordReset.token}`;
        };

        const emailOptions: MailOptionsPasswordReset = {
          from: <string>process.env[envNames.mail.userSupport],
          to: user.email,
          subject: "Password Reset",
          template: "password-reset",
          context: {
            pageTitle: "Password Reset",
            userFullName: user.getFullName(),
            userLink: getUserLink(),
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
      }

      RequestSuccess(req, true);
    } catch (error: any) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      RequestError(
        req,
        Error("Failed to start process of resetting user's password")
      ).server();
    } finally {
      await dbSession.endSession();
    }
  }
  // If the user's information is invalid
  else {
    RequestError(req, Error(errorMessage || undefined)).validation();
  }
};
