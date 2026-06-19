import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './infrastructure/http/auth.controller';
import { PrismaUserRepository } from '../users/infrastructure/database/prisma-user.repository';
import { RegisterUseCase } from './core/use-cases/register.use-case';
import { LoginUseCase } from './core/use-cases/login.use-case';
import { JwtAuthGuard } from './infrastructure/http/guards/jwt-auth.guard';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtAuthGuard,
    {
      provide: RegisterUseCase,
      useFactory: (userRepo: PrismaUserRepository) => {
        return new RegisterUseCase(userRepo);
      },
      inject: [PrismaUserRepository],
    },
    {
      provide: LoginUseCase,
      useFactory: (userRepo: PrismaUserRepository) => {
        return new LoginUseCase(userRepo);
      },
      inject: [PrismaUserRepository],
    },
  ],
  exports: [JwtAuthGuard, RegisterUseCase, LoginUseCase],
})
export class AuthModule {}
