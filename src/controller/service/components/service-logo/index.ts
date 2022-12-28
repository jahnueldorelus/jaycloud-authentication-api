import { Request as ExpressRequest } from "express";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";
import { connection } from "mongoose";
import { dbAuth } from "@services/database";
import { reqErrorMessages } from "@services/request-error-messages";
import path from "path";
import Joi from "joi";
import { ServiceId, ValidServiceId } from "@app-types/service";

// Schema validation
const serviceIdSchema = Joi.object({
  serviceId: Joi.string().token().min(24).max(24).required(),
});

/**
 * Deterimines if the service id is valid.
 * @param serviceId The service id to validate
 */
const validateServiceId = (serviceId: ServiceId): ValidServiceId => {
  const { error, value } = serviceIdSchema.validate(serviceId);
  return {
    isValid: error ? false : true,
    errorMessage: error ? error.message : null,
    validatedValue: value || "",
  };
};

export const getServiceLogo = async (
  req: ExpressRequest,
  serviceId: string
) => {
  // Determines if the user's old refresh token is valid
  const { isValid, errorMessage, validatedValue } = validateServiceId({
    serviceId,
  });

  if (isValid) {
    const dbSession = await connection.startSession();

    try {
      dbSession.startTransaction();
      const serviceLogo = await dbAuth.servicesModel.findById(
        validatedValue.serviceId,
        { logoFileName: 1 },
        { session: dbSession }
      );
      await dbSession.commitTransaction();

      if (!serviceLogo) {
        throw Error(reqErrorMessages.badRequest);
      }

      const pathToServiceLogo = path.resolve(
        `./src/assets/images/${serviceLogo.logoFileName}`
      );

      RequestSuccess(req, undefined, undefined, pathToServiceLogo);
    } catch (error: any) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }
      if (error.message === reqErrorMessages.badRequest) {
        RequestError(
          req,
          Error(
            `Failed to retrieve logo. The service ID provided, "${serviceId}" doesn't exist`
          )
        ).badRequest();
      } else {
        // Default error
        RequestError(
          req,
          Error("Failed to retrieve the service's logo")
        ).server();
      }
    } finally {
      await dbSession.endSession();
    }
  } else {
    RequestError(req, Error(errorMessage || undefined)).validation();
  }
};
