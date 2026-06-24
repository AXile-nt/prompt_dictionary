import { Response } from "express";

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function apiResponse<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response<ApiResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
  });
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): Response<ApiResponse<T[]>> {
  return res.json({
    success: true,
    data,
    error: null,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export function errorResponse(
  res: Response,
  error: string,
  statusCode: number = 500
): Response<ApiResponse<null>> {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error,
  });
}
