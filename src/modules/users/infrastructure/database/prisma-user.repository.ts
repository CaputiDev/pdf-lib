import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../config/prisma/prisma.service';
import { IUserRepository } from '../../core/interfaces/user.repository.interface';
import { UserEntity } from '../../core/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserEntity): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        createdAt: user.createdAt,
      },
    });

    return new UserEntity({
      id: created.id,
      email: created.email,
      password: created.password,
      name: created.name,
      createdAt: created.createdAt,
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const found = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!found) {
      return null;
    }

    return new UserEntity({
      id: found.id,
      email: found.email,
      password: found.password,
      name: found.name,
      createdAt: found.createdAt,
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const found = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!found) {
      return null;
    }

    return new UserEntity({
      id: found.id,
      email: found.email,
      password: found.password,
      name: found.name,
      createdAt: found.createdAt,
    });
  }
}
