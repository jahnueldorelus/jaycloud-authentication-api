import { Request as ExpressRequest } from "express";

// Successful data return type
export type RequestSuccessData = string | number | object | boolean | undefined;

// Successful file return type
export type RequestSuccessFile = string;

// Express response headers
export type ExtraHeaders = Array<{ headerName: string; headerValue: string }>;

// Express success response
type SuccessResponse = {
  headers?: ExtraHeaders;
  data: RequestSuccessData;
  file?: RequestSuccessFile;
};

// Express request with a success property
export interface ExpressRequestSuccess extends ExpressRequest {
  success?: SuccessResponse;
}
