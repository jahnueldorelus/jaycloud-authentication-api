import { Request as ExpressRequest } from "express";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { FormModel, FormModelInputOption } from "@app-types/form-model";

/**
 * Updates the new/update user form model by removing it's Joi validation schema
 * and providing an input name.
 */
export const configureNewAndUpdateUserFormModel =
  (): FormModelInputOption[] => {
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
 * Retrieves the form model to create/update a user.
 * @param creatingUser Determines if the form is to create or update a user
 * @param req The network request
 */
export const getNewAndUpdateUserFormModel =
  (creatingUser: boolean) => async (req: ExpressRequest) => {
    const newUserModelForm: FormModel = {
      title: creatingUser ? "Create a new account" : "Update account",
      inputs: configureNewAndUpdateUserFormModel(),
    };

    RequestSuccess(req, newUserModelForm);
  };
