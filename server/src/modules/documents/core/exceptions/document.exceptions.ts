export class DocumentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DocumentNotFoundException extends DocumentException {
  constructor(id?: string) {
    super('Document with the specified ID was not found.');
  }
}

export class UnauthorizedDocumentException extends DocumentException {
  constructor(
    message = 'You do not have permission to perform this operation on this document.',
  ) {
    super(message);
  }
}

export class InvalidDocumentException extends DocumentException {
  constructor(message: string) {
    super(message);
  }
}
