import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

/**
 * Reusable CRUD for list-type collections. `imageIdField` names the property that stores a
 * Cloudinary public id so replaced/deleted images are cleaned up.
 */
export abstract class BaseCrudService {
  protected constructor(
    protected readonly model: Model<any>,
    protected readonly label: string,
    protected readonly cloudinary: CloudinaryService,
    protected readonly imageIdField?: string,
  ) {}

  list() {
    return this.model.find().sort({ order: 1, createdAt: -1 }).lean().exec();
  }

  create(data: Record<string, unknown>) {
    return this.model.create(data);
  }

  async update(id: string, data: Record<string, unknown>) {
    const existing = await this.model.findById(id).exec();
    if (!existing) throw new NotFoundException(`${this.label} not found.`);
    const oldImage = this.imageIdField ? (existing as any)[this.imageIdField] : undefined;
    existing.set(data);
    const saved = await existing.save();
    if (this.imageIdField && oldImage && oldImage !== (saved as any)[this.imageIdField]) {
      await this.cloudinary.deleteImage(oldImage);
    }
    return saved;
  }

  async remove(id: string) {
    const removed = await this.model.findByIdAndDelete(id).exec();
    if (!removed) throw new NotFoundException(`${this.label} not found.`);
    if (this.imageIdField) await this.cloudinary.deleteImage((removed as any)[this.imageIdField]);
    return { deleted: true };
  }

  count() {
    return this.model.estimatedDocumentCount().exec();
  }
}
