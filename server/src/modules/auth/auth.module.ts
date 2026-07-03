import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './infrastructure/http/auth.controller';
import { IUserRepository } from '../users/core/interfaces/user.repository.interface';
import { RegisterUseCase } from './core/use-cases/register.use-case';
import { LoginUseCase } from './core/use-cases/login.use-case';
import { JwtAuthGuard } from './infrastructure/http/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './infrastructure/http/guards/optional-jwt-auth.guard';

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
    OptionalJwtAuthGuard,
    {
      provide: RegisterUseCase,
      useFactory: (userRepo: IUserRepository) => {
        return new RegisterUseCase(userRepo);
      },
      inject: ['IUserRepository'],
    },
    {
      provide: LoginUseCase,
      useFactory: (userRepo: IUserRepository) => {
        return new LoginUseCase(userRepo);
      },
      inject: ['IUserRepository'],
    },
  ],
  exports: [JwtAuthGuard, OptionalJwtAuthGuard, RegisterUseCase, LoginUseCase],
})
export class AuthModule {}
