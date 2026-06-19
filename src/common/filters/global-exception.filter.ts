import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import {
  DocumentNotFoundException,
  UnauthorizedDocumentException,
  InvalidDocumentException,
} from '../../modules/documents/core/exceptions/document.exceptions';

import {
  UserAlreadyExistsException,
  InvalidUserException,
  InvalidCredentialsException,
} from '../../modules/users/core/exceptions/user.exceptions';

type ExceptionType = new (...args: any[]) => Error;

const domainExceptionMap = new Map<ExceptionType, HttpStatus>([
  [DocumentNotFoundException, HttpStatus.NOT_FOUND],
  [UnauthorizedDocumentException, HttpStatus.FORBIDDEN],
  [InvalidDocumentException, HttpStatus.BAD_REQUEST],

  [UserAlreadyExistsException, HttpStatus.CONFLICT],
  [InvalidUserException, HttpStatus.BAD_REQUEST],
  [InvalidCredentialsException, HttpStatus.UNAUTHORIZED],
]);

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, message } = this.resolveException(exception);

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      error: HttpStatus[status] || 'Error',
      timestamp: new Date().toISOString(),
    });
  }

  private resolveException(exception: unknown): { status: number; message: string | string[] } {
    if (exception instanceof HttpException) {
      const resContent = exception.getResponse();
      const message = typeof resContent === 'object' && resContent !== null && 'message' in resContent
        ? (resContent as Record<string, any>).message
        : exception.message;

      return { status: exception.getStatus(), message };
    }

    // Tratamento genérico de Erros
    if (exception instanceof Error) {
      let currentClass = exception.constructor as ExceptionType;

      // Percorre a cadeia de protótipos para dar suporte a herança de exceções
      while (currentClass && (currentClass as any) !== Object && (currentClass as any) !== Error) {
        if (domainExceptionMap.has(currentClass)) {
          return {
            status: domainExceptionMap.get(currentClass)!,
            message: exception.message
          };
        }
        currentClass = Object.getPrototypeOf(currentClass) as ExceptionType;
      }

      // Se for um Error desconhecido
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: exception.message };
    }

    // Fallback final (caso 'exception' não seja nem objeto de Error)
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Erro interno do servidor' };
  }
}