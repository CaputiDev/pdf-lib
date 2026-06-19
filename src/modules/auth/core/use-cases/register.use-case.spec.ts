import { RegisterUseCase } from './register.use-case';
import { IUserRepository } from '../../../users/core/interfaces/user.repository.interface';
import { UserEntity } from '../../../users/core/entities/user.entity';
import { UserAlreadyExistsException } from '../../../users/core/exceptions/user.exceptions';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    useCase = new RegisterUseCase(mockRepository);
  });

  const input = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test Name',
  };

  it('should register a new user successfully hashing password', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.create.mockImplementation(async (user) => user);

    const result = await useCase.execute(input);

    expect(mockRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(mockRepository.create).toHaveBeenCalled();
    expect(result).toBeInstanceOf(UserEntity);
    expect(result.email).toBe(input.email);
    expect(result.name).toBe(input.name);
    expect(result.password).not.toBe(input.password); // should be hashed!
  });

  it('should throw error if email is already taken', async () => {
    const existingUser = UserEntity.create({ ...input, id: 'user-id' });
    mockRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(useCase.execute(input)).rejects.toThrow(
      UserAlreadyExistsException,
    );
  });
});
