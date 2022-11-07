import { Schema } from "joi";

type FormModelInputType =
  | "alpha"
  | "numeric"
  | "alphanumeric"
  | "date"
  | "password"
  | "email"
  | "tel"
  | "url"
  | "select";

type FormModelValidationType = {
  allowNull: true | false;
  required: true | false;
  min: number;
  max: number;
  regex: string[];
  regexErrorLabel: string;
};

export type FormModelInputOption = {
  type: FormModelInputType;
  multiline: boolean;
  validation: FormModelValidationType;
  label: string;
  name?: string;
  requestBodyProperty?: string;
};

export interface FormModelInputOptionWithJoi extends FormModelInputOption {
  joiSchema: Schema;
}

export interface FormModelInputOptionWithReqProperty
  extends FormModelInputOption {
  requestBodyProperty: string;
}

export type FormModel = {
  title: string;
  inputs: FormModelInputOption[];
};
