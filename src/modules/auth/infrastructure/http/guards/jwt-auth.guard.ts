import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token de autenticação não fornecido.');
    }
    try {
      const payload: unknown = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request as any)['user'] = payload;
    } catch {
      throw new UnauthorizedException(
        'Token de autenticação inválido ou expirado.',
      );
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
