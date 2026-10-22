import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    const parts = token.split('.');
    const secret = process.env.JWT_SECRET;
    if (parts.length !== 3 || !secret) {
      throw new UnauthorizedException('Admin authentication is required.');
    }

    const unsigned = `${parts[0]}.${parts[1]}`;
    const expected = createHmac('sha256', secret).update(unsigned).digest();
    let actual: Buffer;
    try {
      actual = Buffer.from(parts[2], 'base64url');
    } catch {
      throw new UnauthorizedException('Invalid admin token.');
    }
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Invalid admin token.');
    }

    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as { sub?: string; exp?: number };
      if (payload.sub !== process.env.ADMIN_USERNAME || !payload.exp || payload.exp <= Date.now() / 1000) {
        throw new UnauthorizedException('Admin token has expired or is invalid.');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid admin token.');
    }
    return true;
  }
}
