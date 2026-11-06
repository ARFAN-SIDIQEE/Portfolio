import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { LoginThrottle } from '../common/rate-limit';
import { AdminGuard } from './admin.guard';
import { LoginDto } from './dto/login.dto';

function equalSecret(left: string, right: string) {
  const leftDigest = createHmac('sha256', 'portfolio-admin-check').update(left).digest();
  const rightDigest = createHmac('sha256', 'portfolio-admin-check').update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

/** Prefers ADMIN_PASSWORD_HASH (bcrypt) and falls back to the plain ADMIN_PASSWORD. */
async function passwordMatches(password: string) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return compare(password, hash);
  return equalSecret(password, process.env.ADMIN_PASSWORD || '');
}

@Controller('auth')
export class AuthController {
  constructor(private readonly throttle: LoginThrottle) {}

  /** Lets the dashboard check a stored token before showing any admin UI. */
  @Get('me')
  @UseGuards(AdminGuard)
  me() {
    return { username: process.env.ADMIN_USERNAME };
  }

  @Post('login')
  async login(@Body() credentials: LoginDto, @Req() request: Request) {
    const ip = request.ip || 'unknown';
    const { username, password } = credentials;
    this.throttle.assertAllowed(ip, username);

    // Always evaluate both checks so timing does not reveal which one failed.
    const userOk = equalSecret(username, process.env.ADMIN_USERNAME || '');
    const passOk = await passwordMatches(password);
    if (!userOk || !passOk) {
      this.throttle.recordFailure(ip, username);
      throw new UnauthorizedException('Invalid username or password.');
    }
    this.throttle.recordSuccess(ip, username);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured.');
    }
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const lifetime = 60 * 60 * 2;
    const payload = Buffer.from(JSON.stringify({ sub: username, iat: now, exp: now + lifetime })).toString('base64url');
    const unsigned = `${header}.${payload}`;
    const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
    return { accessToken: `${unsigned}.${signature}`, expiresIn: lifetime };
  }
}
