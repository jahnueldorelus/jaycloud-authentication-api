import { Request as ExpressRequest } from "express";
import { newUserAttributes } from "@app-types/user/new-user";
import { RequestSuccess } from "@middleware/request-success";
import { FormModel, FormModelInputOption } from "@app-types/form-model";

/**
 * Updates the user form model by removing it's Joi validation schema
 * and providing an input name.
 */
export const configureUpdateUserFormModel = (): FormModelInputOption[] => {
  const newUserAttributesCopy = <Partial<typeof newUserAttributes>>{
    ...newUserAttributes,
  };

  for (let key of Object.keys(newUserAttributesCopy)) {
    if (key === "email") {
      delete newUserAttributesCopy[key];
    }
  }

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
 * Retrieves the form model to update a user.
 * @param req The network request
 */
export const getUpdateUserFormModel = async (req: ExpressRequest) => {
  const updateUserFormModel: FormModel = {
    title: "Update account",
    inputs: configureUpdateUserFormModel(),
  };

  RequestSuccess(req, updateUserFormModel);
};
