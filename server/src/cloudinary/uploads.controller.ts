import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminGuard } from '../modules/admin.guard';
import { CloudinaryService } from './cloudinary.service';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Controller('uploads')
@UseGuards(AdminGuard)
export class UploadsController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, cb) =>
        ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new BadRequestException('Only JPG, PNG, WEBP or GIF images are allowed.'), false),
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Choose an image file to upload (field name "file").');
    return this.cloudinary.uploadImage(file.buffer);
  }
}
