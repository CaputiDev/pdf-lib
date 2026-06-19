import { LoginUseCase } from './login.use-case';
import { IUserRepository } from '../../../users/core/interfaces/user.repository.interface';
import { UserEntity } from '../../../users/core/entities/user.entity';
import { InvalidCredentialsException } from '../../../users/core/exceptions/user.exceptions';
import * as bcrypt from 'bcrypt';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    useCase = new LoginUseCase(mockRepository);
  });

  const password = 'password123';
  const email = 'test@example.com';

  it('should validate and return the user on correct credentials', async () => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const mockUser = UserEntity.create({
      email,
      password: hashedPassword,
      name: 'Test Name',
      id: 'user-uuid',
    });

    mockRepository.findByEmail.mockResolvedValue(mockUser);

    const result = await useCase.execute({ email, password });

    expect(mockRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(result).toBe(mockUser);
  });

  it('should throw error if user is not found', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email, password })).rejects.toThrow(
      InvalidCredentialsException,
    );
  });

  it('should throw error if password does not match', async () => {
    const incorrectPasswordHash = await bcrypt.hash('wrong-password', 10);
    const mockUser = UserEntity.create({
      email,
      password: incorrectPasswordHash,
      name: 'Test Name',
      id: 'user-uuid',
    });

    mockRepository.findByEmail.mockResolvedValue(mockUser);

    await expect(useCase.execute({ email, password })).rejects.toThrow(
      InvalidCredentialsException,
    );
  });
});
