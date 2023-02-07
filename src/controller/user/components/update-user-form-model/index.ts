import { Request as ExpressRequest } from "express";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import {
  FormModel,
  FormModelInputOption,
  FormModelInputOptionWithJoi,
} from "@app-types/form-model";

/**
 * Updates the user form model by removing it's Joi validation schema
 * and providing an input name.
 */
export const configureUpdateUserFormModel = (): FormModelInputOption[] => {
  const newUserAttributesCopy = <Partial<typeof newUserAttributes>>{
    ...newUserAttributes,
  };

  const inputOptions = Object.keys(newUserAttributesCopy).filter(
    (inputName) => inputName !== "email"
  );

  const newInputOptions = inputOptions.map((inputName) => {
    const input = <Partial<FormModelInputOptionWithJoi>>(
      newUserAttributesCopy[inputName]
    );

    if (input) {
      input.joiSchema = undefined;
      input.name = inputName;

      // Makes all inputs optional
      if (input.validation) {
        input.validation.required = false;
      }
    }

    return input;
  });

  return <FormModelInputOption[]>newInputOptions;
};

/**
 * Retrieves the form model to update a user.
 * @param req The network request
 */
export const getUpdateUserFormModel = async (req: ExpressRequest) => {
  const updateUserFormModel: FormModel = {
    title: "Update Profile",
    inputs: configureUpdateUserFormModel(),
  };

  RequestSuccess(req, updateUserFormModel);
};
