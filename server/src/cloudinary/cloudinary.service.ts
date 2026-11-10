import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadedImage {
  url: string;
  publicId: string;
}

/** Marks images uploaded by this app so cleanup never touches anything else in the account. */
export const MANAGED_TAG = 'portfolio-managed';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  /**
   * Folder this environment uploads to and may delete from. Use a different value per
   * environment (e.g. portfolio, portfolio-staging) when they share one Cloudinary account.
   */
  get folder() {
    return (process.env.CLOUDINARY_FOLDER || 'portfolio').replace(/^\/+|\/+$/g, '');
  }

  isConfigured() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
  }

  private configure() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new ServiceUnavailableException(
        'Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env.',
      );
    }
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
      // Only for tests against a local stub; leave unset in real use.
      ...(process.env.CLOUDINARY_API_BASE ? { upload_prefix: process.env.CLOUDINARY_API_BASE, secure: false } : {}),
    });
  }

  uploadImage(buffer: Buffer, folder = this.folder): Promise<UploadedImage> {
    this.configure();
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: 'image', tags: [MANAGED_TAG] }, (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary upload failed.'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        })
        .end(buffer);
    });
  }

  /** Lists images this app uploaded (tagged) inside this environment's folder only (paged). */
  async listImages(): Promise<{ publicId: string; createdAt: string }[]> {
    this.configure();
    const found: { publicId: string; createdAt: string }[] = [];
    let next: string | undefined;
    do {
      const page: any = await cloudinary.api.resources_by_tag(MANAGED_TAG, { resource_type: 'image', max_results: 500, next_cursor: next });
      for (const item of page.resources ?? []) {
        if (typeof item.public_id === 'string' && item.public_id.startsWith(`${this.folder}/`)) {
          found.push({ publicId: item.public_id, createdAt: item.created_at });
        }
      }
      next = page.next_cursor;
    } while (next);
    return found;
  }

  /**
   * Best-effort cleanup: a failed delete must never block a database write.
   * Only ids inside this environment's managed folder are ever deleted.
   */
  async deleteImage(publicId?: string) {
    if (!publicId) return;
    if (!publicId.startsWith(`${this.folder}/`)) {
      this.logger.warn(`Refusing to delete "${publicId}": outside the managed folder "${this.folder}/".`);
      return;
    }
    try {
      this.configure();
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.warn(`Could not delete Cloudinary image ${publicId}: ${(error as Error).message}`);
    }
  }
}
