import 'dotenv/config';
import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { apiRateLimiter } from './common/rate-limit';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Copy .env.example to server/.env and set your MongoDB Atlas connection string.');
  }
  if (!/^mongodb(\+srv)?:\/\//.test(process.env.MONGODB_URI)) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://.');
  }
  if (!process.env.ADMIN_USERNAME || !(process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH) || !process.env.JWT_SECRET) {
    throw new Error('ADMIN_USERNAME, ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) and JWT_SECRET are required in server/.env before starting the API.');
  }
  if (process.env.JWT_SECRET.length < 32) {
    const message = "JWT_SECRET must be at least 32 characters. Generate a random one (see .env.example).";
    if (process.env.NODE_ENV === 'production') throw new Error(message);
    logger.warn(message);
  }

  let app;
  try {
    app = await NestFactory.create(AppModule);
  } catch (error) {
    const message = (error as Error).message ?? String(error);
    if (/ENOTFOUND|ECONNREFUSED|ServerSelection|Could not connect|querySrv/i.test(message)) {
      logger.error(
        'MongoDB Atlas connection failed. Check that (1) this machine\'s IP is allowed under Atlas > Network Access, ' +
          '(2) the database user and password in MONGODB_URI are correct (URL-encode special characters), and (3) the cluster is not paused.',
      );
    }
    throw error;
  }

  app.setGlobalPrefix('api');
  // Needed so req.ip is the real client IP (rate limiting) when behind a proxy such as Render/Railway/Nginx.
  if (process.env.TRUST_PROXY) (app.getHttpAdapter().getInstance() as any).set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: process.env.CLIENT_ORIGIN?.split(',').map((origin) => origin.trim()) || 'http://localhost:5173',
  });
  // After CORS so 429 responses still carry CORS headers and the browser can read the message.
  app.use(apiRateLimiter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(Number(process.env.PORT) || 3000, '0.0.0.0');
}

void bootstrap();
