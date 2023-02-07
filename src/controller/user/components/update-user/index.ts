import Joi from "joi";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { RequestError } from "@middleware/request-error";
import { connection } from "mongoose";
import { envNames } from "@startup/config";
import {
  getRequestUserData,
  requestIsAuthorized,
} from "@middleware/authorization";
import { ExpressRequestAndUser } from "@app-types/authorization";
import {
  UserUpdateData,
  ValidUserUpdateInfo,
} from "@app-types/user/update-user";
import { dbAuth } from "@services/database";
import { reqErrorMessages } from "@services/request-error-messages";
import { genSalt, hash } from "bcrypt";

// Schema validation
const updatetAccountSchema = Joi.object({
  firstName: newUserAttributes.firstName.joiSchema.optional(),
  lastName: newUserAttributes.lastName.joiSchema.optional(),
  password: newUserAttributes.password.joiSchema.optional(),
});

/**
 * Deterimines if the user's account information is valid.
 * @param newUserInfo The user's information to validate
 */
const validateInfo = (newUserInfo: UserUpdateData): ValidUserUpdateInfo => {
  const { error, value } = updatetAccountSchema.validate(newUserInfo);

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
 * Updates a new user.
 * @param req The network request
 */
export const updateUser = async (req: ExpressRequestAndUser): Promise<void> => {
  const reqUser = getRequestUserData(req);

  if (requestIsAuthorized(req) && reqUser) {
    // The user's updated account info from the request
    const newUserInfo: UserUpdateData = req.body;

    // Determines if the user's updated information is valid
    const { isValid, errorMessage, validatedValue } = validateInfo(newUserInfo);

    if (isValid) {
      const dbSession = await connection.startSession();

      try {
        //
        if (validatedValue.password) {
          // Generates a salt for hashing
          const salt = await genSalt();
          // Hashes the user's password
          validatedValue.password = await hash(validatedValue.password, salt);
        }

        dbSession.startTransaction();
        const newUserInfo = await dbAuth.usersModel.findByIdAndUpdate(
          reqUser.id,
          validatedValue,
          { session: dbSession, new: true }
        );
        await dbSession.commitTransaction();

        if (!newUserInfo) {
          throw Error(reqErrorMessages.nonExistentUser);
        }

        const accessToken = newUserInfo.generateAccessToken();

        RequestSuccess(req, newUserInfo.toPrivateJSON(), [
          // The access token
          {
            headerName: <string>process.env[envNames.jwt.accessReqHeader],
            headerValue: accessToken,
          },
        ]);
      } catch (error: any) {
        if (dbSession.inTransaction()) {
          await dbSession.abortTransaction();
        }

        // If the user to update doesn't exist
        if (error.message === reqErrorMessages.nonExistentUser) {
          RequestError(
            req,
            Error("Failed to update the account. The user doesn't exist")
          ).badRequest();
        } else {
          // Default error
          RequestError(req, Error("Failed to update the account.")).server();
        }
      } finally {
        await dbSession.endSession();
      }
    }
    // If there's a validation error
    else {
      RequestError(req, Error(errorMessage)).validation();
    }
  }
};
