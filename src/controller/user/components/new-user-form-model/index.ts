import { Request as ExpressRequest } from "express";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { FormModel, FormModelInputOption } from "@app-types/form-model";
import { cloneDeep } from "lodash";

/**
 * Updates the new user form model by removing it's Joi validation schema
 * and providing an input name.
 */
export const configureNewUserFormModel = (): FormModelInputOption[] => {
  const newUserAttributesCopy = cloneDeep(newUserAttributes);
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
 * Retrieves the form model to create a user.
 * @param req The network request
 */
export const getNewUserFormModel = async (req: ExpressRequest) => {
  const newUserFormModel: FormModel = {
    title: "Create A New Account",
    inputs: configureNewUserFormModel(),
  };

  RequestSuccess(req, newUserFormModel);
};
