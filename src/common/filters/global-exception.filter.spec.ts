import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import {
  UserAlreadyExistsException,
  InvalidCredentialsException,
  InvalidUserException,
} from '../../modules/users/core/exceptions/user.exceptions';
import {
  DocumentNotFoundException,
  UnauthorizedDocumentException,
  InvalidDocumentException,
} from '../../modules/documents/core/exceptions/document.exceptions';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: any;
  let mockArgumentsHost: any;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({}),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle HttpException correctly', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['Test error'],
        error: 'BAD_REQUEST',
      }),
    );
  });

  it('should handle UserAlreadyExistsException mapping to 409 CONFLICT', () => {
    const exception = new UserAlreadyExistsException('test@example.com');
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: [exception.message],
        error: 'CONFLICT',
      }),
    );
  });

  it('should handle InvalidCredentialsException mapping to 401 UNAUTHORIZED', () => {
    const exception = new InvalidCredentialsException();
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: [exception.message],
        error: 'UNAUTHORIZED',
      }),
    );
  });

  it('should handle InvalidUserException mapping to 400 BAD_REQUEST', () => {
    const exception = new InvalidUserException('Invalid user details');
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [exception.message],
        error: 'BAD_REQUEST',
      }),
    );
  });

  it('should handle DocumentNotFoundException mapping to 404 NOT_FOUND', () => {
    const exception = new DocumentNotFoundException('doc-id');
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: [exception.message],
        error: 'NOT_FOUND',
      }),
    );
  });

  it('should handle subclassed domain exceptions using inheritance mapping', () => {
    class SubclassedDocumentNotFoundException extends DocumentNotFoundException {
      constructor() {
        super('subclassed-id');
      }
    }
    const exception = new SubclassedDocumentNotFoundException();
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: [exception.message],
        error: 'NOT_FOUND',
      }),
    );
  });

  it('should handle UnauthorizedDocumentException mapping to 403 FORBIDDEN', () => {
    const exception = new UnauthorizedDocumentException();
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        message: [exception.message],
        error: 'FORBIDDEN',
      }),
    );
  });

  it('should handle InvalidDocumentException mapping to 400 BAD_REQUEST', () => {
    const exception = new InvalidDocumentException('Invalid format');
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [exception.message],
        error: 'BAD_REQUEST',
      }),
    );
  });

  it('should handle unmapped/generic Errors mapping to 500 INTERNAL_SERVER_ERROR', () => {
    const exception = new Error('Generic database failure');
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: ['Generic database failure'],
        error: 'INTERNAL_SERVER_ERROR',
      }),
    );
  });

  it('should handle unknown throws mapping to 500 INTERNAL_SERVER_ERROR', () => {
    const exception = 'Unexpected string exception';
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: ['Erro interno do servidor'],
        error: 'INTERNAL_SERVER_ERROR',
      }),
    );
  });
});
