export class UserException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UserAlreadyExistsException extends UserException {
  constructor(email?: string) {
    super('Email address is already in use.');
  }
}

export class InvalidUserException extends UserException {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCredentialsException extends UserException {
  constructor(message = 'Invalid email or password.') {
    super(message);
  }
}
