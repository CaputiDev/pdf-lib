import * as crypto from 'crypto';
import { InvalidUserException } from '../exceptions/user.exceptions';

export class UserEntity {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly name: string;
  readonly createdAt: Date;

  constructor(properties: {
    id: string;
    email: string;
    password: string;
    name: string;
    createdAt: Date;
  }) {
    this.id = properties.id;
    this.email = properties.email;
    this.password = properties.password;
    this.name = properties.name;
    this.createdAt = properties.createdAt;
  }

  static create(properties: {
    email: string;
    password: string;
    name: string;
    id?: string;
    createdAt?: Date;
  }): UserEntity {
    if (!properties.email || !properties.email.includes('@')) {
      throw new InvalidUserException(
        'The provided email address is invalid or empty.',
      );
    }
    if (!properties.password || properties.password.trim() === '') {
      throw new InvalidUserException('User password cannot be empty.');
    }
    if (!properties.name || properties.name.trim() === '') {
      throw new InvalidUserException('User name cannot be empty.');
    }

    return new UserEntity({
      id: properties.id ?? crypto.randomUUID(),
      email: properties.email.trim().toLowerCase(),
      password: properties.password,
      name: properties.name.trim(),
      createdAt: properties.createdAt ?? new Date(),
    });
  }
}
