import { Request as ExpressRequest } from "express";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import {
  FormModel,
  FormModelInputOption,
  FormModelInputOptionWithJoi,
} from "@app-types/form-model";
import { cloneDeep } from "lodash";

/**
 * Sets up the input options for the password reset form model.
 */
export const configurePasswordResetFormModel = (): FormModelInputOption[] => {
  const inputOptions: FormModelInputOption[] = [
    <Omit<FormModelInputOptionWithJoi, "joiSchema">>{
      ...cloneDeep(newUserAttributes.email),
      name: "email",
      joiSchema: undefined,
    },
  ];

  return <FormModelInputOption[]>inputOptions;
};

/**
 * Retrieves the form model for a password reset.
 * @param req The network request
 */
export const getPasswordResetFormModel = async (req: ExpressRequest) => {
  const newUserModelForm: FormModel = {
    title: "Forgot Password",
    inputs: configurePasswordResetFormModel(),
  };

  RequestSuccess(req, newUserModelForm);
};
