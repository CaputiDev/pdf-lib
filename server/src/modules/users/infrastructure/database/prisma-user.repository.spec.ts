import { Test, TestingModule } from '@nestjs/testing';
import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaService } from '../../../../config/prisma/prisma.service';
import { UserEntity } from '../../core/entities/user.entity';

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaUserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaUserRepository>(PrismaUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockDbUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashedpassword',
    name: 'Test Name',
    createdAt: new Date(),
  };

  describe('create', () => {
    it('should create a user and return its entity', async () => {
      const userEntity = UserEntity.create({
        id: 'user-id-123',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test Name',
      });

      mockPrismaService.user.create.mockResolvedValue(mockDbUser);

      const result = await repository.create(userEntity);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          id: 'user-id-123',
          email: 'test@example.com',
          password: 'hashedpassword',
          name: 'Test Name',
          createdAt: expect.any(Date),
        },
      });

      expect(result).toBeInstanceOf(UserEntity);
      expect(result.id).toBe('user-id-123');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('findByEmail', () => {
    it('should return UserEntity if user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockDbUser);

      const result = await repository.findByEmail('test@example.com');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.id).toBe('user-id-123');
    });

    it('should return null if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('non-existent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return UserEntity if user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockDbUser);

      const result = await repository.findById('user-id-123');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
      });
      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.id).toBe('user-id-123');
    });

    it('should return null if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
