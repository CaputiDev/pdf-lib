import { UserEntity } from './user.entity';
import { InvalidUserException } from '../exceptions/user.exceptions';

describe('UserEntity', () => {
  it('should create a valid user entity with trimmed email/name and lowercase email', () => {
    const user = UserEntity.create({
      email: '  Test@Example.Com  ',
      password: 'password123',
      name: '  John Doe  ',
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('John Doe');
    expect(user.password).toBe('password123');
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('should throw InvalidUserException if email does not contain @', () => {
    expect(() =>
      UserEntity.create({
        email: 'invalid-email',
        password: 'password123',
        name: 'John Doe',
      }),
    ).toThrow(InvalidUserException);

    expect(() =>
      UserEntity.create({
        email: '',
        password: 'password123',
        name: 'John Doe',
      }),
    ).toThrow(InvalidUserException);
  });

  it('should throw InvalidUserException if password is empty or whitespace', () => {
    expect(() =>
      UserEntity.create({
        email: 'test@example.com',
        password: '',
        name: 'John Doe',
      }),
    ).toThrow(InvalidUserException);

    expect(() =>
      UserEntity.create({
        email: 'test@example.com',
        password: '   ',
        name: 'John Doe',
      }),
    ).toThrow(InvalidUserException);
  });

  it('should throw InvalidUserException if name is empty or whitespace', () => {
    expect(() =>
      UserEntity.create({
        email: 'test@example.com',
        password: 'password123',
        name: '',
      }),
    ).toThrow(InvalidUserException);

    expect(() =>
      UserEntity.create({
        email: 'test@example.com',
        password: 'password123',
        name: '   ',
      }),
    ).toThrow(InvalidUserException);
  });
});
