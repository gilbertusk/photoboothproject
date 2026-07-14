import { Response } from 'express';
import { z } from 'zod';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export const sendSuccess = <T>(res: Response, data?: T, message: string = 'Success', statusCode: number = 200): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
  };
  if (data !== undefined) {
    response.data = data;
  }
  res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string = 'Internal Server Error', statusCode: number = 500): void => {
  const response: ApiResponse = {
    success: false,
    message,
  };
  res.status(statusCode).json(response);
};

/**
 * Format Zod validation errors into a human-readable string.
 */
export const formatZodError = (error: z.ZodError): string => {
  return error.issues.map(issue => issue.message).join(', ');
};
