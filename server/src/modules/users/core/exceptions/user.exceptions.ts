export class UserException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UserAlreadyExistsException extends UserException {
  constructor(email: string) {
    super(`Um usuário com o e-mail "${email}" já está cadastrado.`);
  }
}

export class InvalidUserException extends UserException {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCredentialsException extends UserException {
  constructor(message = 'E-mail ou senha inválidos.') {
    super(message);
  }
}
