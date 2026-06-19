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

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent = exception.getResponse();
      message = typeof resContent === 'object' && resContent !== null && 'message' in resContent
        ? (resContent as any).message
        : exception.message;
    } else if (exception instanceof DocumentNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    } else if (exception instanceof UnauthorizedDocumentException) {
      status = HttpStatus.FORBIDDEN;
      message = exception.message;
    } else if (exception instanceof InvalidDocumentException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      error: HttpStatus[status] || 'Error',
      timestamp: new Date().toISOString(),
    });
  }
}
