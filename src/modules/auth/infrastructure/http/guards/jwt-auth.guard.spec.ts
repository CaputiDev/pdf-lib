import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    } as any;
    guard = new JwtAuthGuard(jwtService);
  });

  const mockExecutionContext = (authHeader?: string): ExecutionContext => {
    const request = {
      headers: {
        authorization: authHeader,
      },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  };

  it('should return true and assign user to request on valid token', async () => {
    const payload = { id: 'user-uuid', email: 'test@example.com' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const context = mockExecutionContext('Bearer valid-token');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', expect.any(Object));
    expect(context.switchToHttp().getRequest()['user']).toEqual(payload);
  });

  it('should throw UnauthorizedException if auth header is missing', async () => {
    const context = mockExecutionContext(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if auth header does not start with Bearer', async () => {
    const context = mockExecutionContext('Basic credentials');
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if token verification fails', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    const context = mockExecutionContext('Bearer invalid-token');
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
