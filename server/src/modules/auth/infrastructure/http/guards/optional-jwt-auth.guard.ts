import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (token) {
      try {
        const payload: unknown = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (request as any)['user'] = payload;
      } catch {
        // Fail silently so the request proceeds as an anonymous/unauthenticated request
      }
    }
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
