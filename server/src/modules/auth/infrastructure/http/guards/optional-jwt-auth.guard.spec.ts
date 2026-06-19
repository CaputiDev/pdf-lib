/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext } from '@nestjs/common';

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    } as any;
    guard = new OptionalJwtAuthGuard(jwtService);
  });

  const mockExecutionContext = (
    authHeader?: string,
    queryToken?: string,
  ): ExecutionContext => {
    const request = {
      headers: {
        authorization: authHeader,
      },
      query: {
        token: queryToken,
      },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  };

  it('should return true and assign user to request on valid token in header', async () => {
    const payload = { id: 'user-uuid', email: 'test@example.com' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const context = mockExecutionContext('Bearer valid-token');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      'valid-token',
      expect.any(Object),
    );
    expect(context.switchToHttp().getRequest()['user']).toEqual(payload);
  });

  it('should return true and assign user to request on valid token in query param', async () => {
    const payload = { id: 'user-uuid', email: 'test@example.com' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const context = mockExecutionContext(undefined, 'query-token');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      'query-token',
      expect.any(Object),
    );
    expect(context.switchToHttp().getRequest()['user']).toEqual(payload);
  });

  it('should return true and NOT assign user to request if auth token is missing in both header and query', async () => {
    const context = mockExecutionContext(undefined, undefined);
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(context.switchToHttp().getRequest()['user']).toBeUndefined();
  });

  it('should return true and NOT assign user to request if auth header does not start with Bearer and query is empty', async () => {
    const context = mockExecutionContext('Basic credentials');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(context.switchToHttp().getRequest()['user']).toBeUndefined();
  });

  it('should return true and NOT assign user to request if token verification fails', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    const context = mockExecutionContext('Bearer invalid-token');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(context.switchToHttp().getRequest()['user']).toBeUndefined();
  });
});
