import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile } from '../content/schemas';
import { Project } from '../modules/schemas/project.schema';
import { CloudinaryService } from './cloudinary.service';

/**
 * Admins upload an image first and save the form afterwards, so abandoned uploads
 * (cancelled forms, replaced-before-save images) would stay in Cloudinary forever.
 * This sweep deletes images this app uploaded (tagged) into CLOUDINARY_FOLDER that no document references and
 * that are older than the grace period (so an upload being edited right now is safe).
 */
@Injectable()
export class OrphanCleanupService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OrphanCleanupService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly cloudinary: CloudinaryService,
    @InjectModel(Project.name) private readonly projects: Model<Project>,
    @InjectModel(Profile.name) private readonly profiles: Model<Profile>,
  ) {}

  onApplicationBootstrap() {
    if (process.env.CLOUDINARY_CLEANUP === 'off' || !this.cloudinary.isConfigured()) return;
    const hours = Number(process.env.CLOUDINARY_CLEANUP_INTERVAL_HOURS) || 6;
    setTimeout(() => void this.sweepSafely(), 60_000).unref();
    this.timer = setInterval(() => void this.sweepSafely(), hours * 3_600_000);
    this.timer.unref();
  }

  onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
  }

  private graceFromEnv() {
    const raw = process.env.CLOUDINARY_ORPHAN_GRACE_MINUTES;
    const minutes = raw === undefined || raw === '' ? NaN : Number(raw);
    return Number.isFinite(minutes) && minutes >= 0 ? minutes : 60;
  }

  private async sweepSafely() {
    try {
      const result = await this.sweep();
      if (result.deleted.length) this.logger.log(`Removed ${result.deleted.length} orphaned image(s) from Cloudinary.`);
    } catch (error) {
      this.logger.warn(`Orphan sweep skipped: ${(error as Error).message}`);
    }
  }

  async sweep(graceMinutes = this.graceFromEnv()) {
    const [projectIds, profileIds] = await Promise.all([
      this.projects.distinct('imagePublicId').exec(),
      this.profiles.distinct('avatarPublicId').exec(),
    ]);
    const referenced = new Set<string>([...projectIds, ...profileIds].filter(Boolean));
    const cutoff = Date.now() - graceMinutes * 60_000;

    const stored = await this.cloudinary.listImages();
    const orphans = stored.filter((image) => !referenced.has(image.publicId) && new Date(image.createdAt).getTime() < cutoff);
    for (const orphan of orphans) await this.cloudinary.deleteImage(orphan.publicId);
    return { scanned: stored.length, deleted: orphans.map((image) => image.publicId) };
  }
}
