import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { RegisterUseCase } from '../../core/use-cases/register.use-case';
import { LoginUseCase } from '../../core/use-cases/login.use-case';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../../../users/core/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let registerUseCase: jest.Mocked<RegisterUseCase>;
  let loginUseCase: jest.Mocked<LoginUseCase>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockRegisterUseCase = { execute: jest.fn() };
    const mockLoginUseCase = { execute: jest.fn() };
    const mockJwtService = { signAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUseCase, useValue: mockRegisterUseCase },
        { provide: LoginUseCase, useValue: mockLoginUseCase },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    registerUseCase = module.get(RegisterUseCase);
    loginUseCase = module.get(LoginUseCase);
    jwtService = module.get(JwtService);
  });

  const mockUser = UserEntity.create({
    email: 'test@example.com',
    password: 'hashed-password',
    name: 'Test User',
    id: 'user-uuid',
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      registerUseCase.execute.mockResolvedValue(mockUser);

      const dto = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      const result = await controller.register(dto);

      expect(registerUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
      });
    });
  });

  describe('login', () => {
    it('should authenticate user and return token with user info', async () => {
      loginUseCase.execute.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('jwt-access-token');

      const dto = { email: 'test@example.com', password: 'password123' };
      const result = await controller.login(dto);

      expect(loginUseCase.execute).toHaveBeenCalledWith(dto);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { id: mockUser.id, email: mockUser.email, name: mockUser.name },
        expect.any(Object),
      );
      expect(result).toEqual({
        access_token: 'jwt-access-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      });
    });
  });
});
