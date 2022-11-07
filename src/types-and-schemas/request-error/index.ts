import { Request as ExpressRequest } from "express";

// Express request error methods
export type RequestErrorMethods = {
  badRequest: () => void;
  notAuthorized: () => void;
  forbidden: () => void;
  validation: () => void;
  server: () => void;
};

// An error object within a network request
type RequestError = {
  status: number;
  errorMessage: string;
};

// Express request with an error property
export interface ExpressRequestError extends ExpressRequest {
  failed?: RequestError;
}
