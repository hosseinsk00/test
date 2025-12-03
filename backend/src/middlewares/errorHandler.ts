import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ خطا:', error);

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      return res.status(400).json({
        success: false,
        message: `مقدار ${field} تکراری است`,
      });
    }

    // Record not found
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'رکورد مورد نظر یافت نشد',
      });
    }
  }

  // Joi validation errors
  if (error.name === 'ValidationError' && error.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'خطای اعتبارسنجی',
      errors: error.details.map((detail: any) => detail.message),
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'توکن نامعتبر',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'توکن منقضی شده',
    });
  }

  // Default error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'خطای سرور',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
