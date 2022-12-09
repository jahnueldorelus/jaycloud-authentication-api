import { Request as ExpressRequest } from "express";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import {
  FormModelInputOptionWithJoi,
  FormModelInputOptionWithReqProperty,
  FormModel,
} from "@app-types/form-model";

/**
 * Updates the new user form model by removing it's Joi validation schema
 * from all inputs and adding both a request body property and an input name.
 * @param userFormModelInputs The form model to update
 */
export const configureNewUserFormModel = (
  userFormModelInputs: Record<string, FormModelInputOptionWithJoi>
): FormModelInputOptionWithReqProperty[] => {
  const inputOptions = Object.keys(userFormModelInputs);

  const newInputOptions = inputOptions.map((inputName) => {
    const newOption = {
      ...userFormModelInputs[inputName],
      joiSchema: undefined,
      name: inputName,
      requestBodyProperty: inputName,
    };

    delete newOption.joiSchema;

    return newOption;
  });

  return <FormModelInputOptionWithReqProperty[]>newInputOptions;
};

/**
 * Retrieves the form model for a new user.
 * @param req The network request
 */
export const getNewUserFormModel = async (req: ExpressRequest) => {
  const newUserModelForm: FormModel = {
    title: "Create a new account",
    inputs: configureNewUserFormModel(newUserAttributes),
  };

  RequestSuccess(req, newUserModelForm);
};
