import { FormModelInputOptionWithJoi } from "@app-types/form-model";
import Joi from "joi";
import { RegExpError } from "@services/reg-exp-error";
import { JoiValidationResults } from "@app-types/joi-validation";

interface User<T> {
  firstName: T;
  lastName: T;
  email: T;
  password: T;
}

export type NewUser = User<string>;
export type ValidNewUserAccount = JoiValidationResults<NewUser>;

interface NewUserAttributes extends User<FormModelInputOptionWithJoi> {
  [key: string]: FormModelInputOptionWithJoi;
}

export const newUserAttributes: NewUserAttributes = {
  firstName: {
    label: "First Name",
    type: "alpha",
    multiline: false,
    validation: {
      allowNull: false,
      max: 255,
      min: 2,
      required: true,
      regex: ["^[a-zA-ZÀ-ÿ\\s]{2,255}$"],
      regexErrorLabel: new RegExpError(true, true, false, false, 2, 255).label,
    },
    joiSchema: Joi.string().lowercase().min(2).max(255).required(),
  },
  lastName: {
    label: "Last Name",
    type: "alpha",
    multiline: false,
    validation: {
      allowNull: false,
      max: 255,
      min: 2,
      required: true,
      regex: ["^[a-zA-ZÀ-ÿ\\s]{2,255}$"],
      regexErrorLabel: new RegExpError(true, true, false, false, 2, 255).label,
    },
    joiSchema: Joi.string().lowercase().min(2).max(255).required(),
  },
  email: {
    label: "Email",
    type: "email",
    multiline: false,
    validation: {
      allowNull: false,
      max: 100,
      min: 5,
      required: true,
      regex: [
        "^[a-zA-ZÀ-ÿ\\d_.+-]+@[a-zA-ZÀ-ÿ\\d_.+-]+\\.[a-zA-ZÀ-ÿ\\d_.+-]+$",
        "^[a-zA-ZÀ-ÿ\\d_.+-@]{5,100}$",
      ],
      regexErrorLabel: new RegExpError(
        true,
        true,
        true,
        true,
        5,
        100,
        "Must be a valid email"
      ).label,
    },
    joiSchema: Joi.string()
      .lowercase()
      .min(5)
      .max(100)
      .email({ tlds: { allow: false } })
      .required(),
  },
  password: {
    label: "Password",
    type: "password",
    multiline: false,
    validation: {
      allowNull: false,
      max: 100,
      min: 5,
      required: true,
      regex: ["^[\\D\\d\\s]{5,100}$"],
      regexErrorLabel: new RegExpError(true, true, true, true, 5, 100).label,
    },
    joiSchema: Joi.string().min(5).max(100).required(),
  },
};
