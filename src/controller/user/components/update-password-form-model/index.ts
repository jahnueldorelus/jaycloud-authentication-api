import { Request as ExpressRequest } from "express";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { FormModel, FormModelInputOption } from "@app-types/form-model";

/**
 * Sets up the input options for the update password form model.
 */
export const configurePasswordResetFormModel = (): FormModelInputOption[] => {
  const inputOptions: FormModelInputOption[] = [
    {
      ...newUserAttributes.password,
      name: "password",
    },
  ];

  return <FormModelInputOption[]>inputOptions;
};

/**
 * Retrieves the form model to update a password.
 * @param req The network request
 */
export const getUpdatePasswordFormModel = async (req: ExpressRequest) => {
  const newUserModelForm: FormModel = {
    title: "Update Password",
    inputs: configurePasswordResetFormModel(),
  };

  RequestSuccess(req, newUserModelForm);
};
