import { Module } from '@nestjs/common';
import { PrismaUserRepository } from './infrastructure/database/prisma-user.repository';

@Module({
  providers: [PrismaUserRepository],
  exports: [PrismaUserRepository],
})
export class UsersModule {}
