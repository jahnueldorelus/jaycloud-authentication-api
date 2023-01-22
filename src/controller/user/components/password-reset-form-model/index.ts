import { Request as ExpressRequest } from "express";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { FormModel, FormModelInputOption } from "@app-types/form-model";

/**
 * Sets up the input options for the password reset form model.
 */
export const configurePasswordResetFormModel = (): FormModelInputOption[] => {
  const inputOptions: FormModelInputOption[] = [
    {
      ...newUserAttributes.email,
      name: "email",
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
