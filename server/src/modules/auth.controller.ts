import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { LoginDto } from './dto/login.dto';

function equalSecret(left: string, right: string) {
  const leftDigest = createHmac('sha256', 'portfolio-admin-check').update(left).digest();
  const rightDigest = createHmac('sha256', 'portfolio-admin-check').update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() credentials: LoginDto) {
    const { username, password } = credentials;
    if (!equalSecret(username, process.env.ADMIN_USERNAME || '') ||
        !equalSecret(password, process.env.ADMIN_PASSWORD || '')) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured.');
    }
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
    const payload = Buffer.from(JSON.stringify({ sub: username, exp: expiresAt })).toString('base64url');
    const unsigned = `${header}.${payload}`;
    const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
    return { accessToken: `${unsigned}.${signature}` };
  }
}
