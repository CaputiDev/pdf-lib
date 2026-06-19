export class DocumentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DocumentNotFoundException extends DocumentException {
  constructor(id: string) {
    super(`Documento com ID "${id}" não foi encontrado.`);
  }
}

export class UnauthorizedDocumentException extends DocumentException {
  constructor(
    message = 'Você não tem permissão para realizar esta operação neste documento.',
  ) {
    super(message);
  }
}

export class InvalidDocumentException extends DocumentException {
  constructor(message: string) {
    super(message);
  }
}
