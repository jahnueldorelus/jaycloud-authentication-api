import { Request as ExpressRequest } from "express";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { FormModel, FormModelInputOption } from "@app-types/form-model";

/**
 * Updates the new user form model by removing it's Joi validation schema
 * and providing an input name.
 */
export const configureNewUserFormModel = (): FormModelInputOption[] => {
  const newUserAttributesCopy = { ...newUserAttributes };
  const inputOptions = Object.keys(newUserAttributesCopy);

  const newInputOptions = inputOptions.map((inputName) => {
    const newOption = {
      ...newUserAttributesCopy[inputName],
      name: inputName,
    };
    delete newOption.joiSchema;

    return newOption;
  });

  return <FormModelInputOption[]>newInputOptions;
};

/**
 * Retrieves the form model for a new user.
 * @param req The network request
 */
export const getNewUserFormModel = async (req: ExpressRequest) => {
  const newUserModelForm: FormModel = {
    title: "Create a new account",
    inputs: configureNewUserFormModel(),
  };

  RequestSuccess(req, newUserModelForm);
};
