import { Request as ExpressRequest } from "express";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import {
  FormModelInputOptionWithJoi,
  FormModelInputOption,
  FormModel,
} from "@app-types/form-model";
import { RegExpError } from "@services/reg-exp-error";
import { cloneDeep } from "lodash";

/**
 * Updates the authenticating user form model by removing it's Joi validation schema
 * from all inputs and adding both a request body property and an input name.
 * @param userFormModelInputs The form model to update
 */
export const configureAuthenticateUserFormModel = (
  userFormModelInputs: Record<string, FormModelInputOptionWithJoi>
): FormModelInputOption[] => {
  const inputOptions = Object.keys(userFormModelInputs);

  const newInputOptions = inputOptions.map((inputName) => {
    const newOption = {
      ...userFormModelInputs[inputName],
      validation: {
        allowNull: true,
        required: true,
        min: 0,
        max: 150,
        regex: ["^.*$"],
        regexErrorLabel: new RegExpError(
          true,
          true,
          true,
          true,
          0,
          150,
          "Only a maximum of 150 characters is allowed."
        ).label,
      },
      joiSchema: undefined,
      name: inputName,
    };

    delete newOption.joiSchema;

    return newOption;
  });

  return <FormModelInputOption[]>newInputOptions;
};

/**
 * Retrieves the form model for authenticating a user.
 * @param req The network request
 */
export const getAuthenticateUserFormModel = async (req: ExpressRequest) => {
  const newUserAttributesCopy = cloneDeep(newUserAttributes);

  for (let key of Object.keys(newUserAttributesCopy)) {
    if (key !== "password" && key !== "email") {
      delete newUserAttributesCopy[key];
    }
  }

  const authenticateUserModelForm: FormModel = {
    title: "Login",
    inputs: configureAuthenticateUserFormModel(newUserAttributesCopy),
  };

  RequestSuccess(req, authenticateUserModelForm);
};
