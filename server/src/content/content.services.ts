import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { BaseCrudService } from '../common/base-crud.service';
import { Education, Experience, Profile, ServiceItem, SiteSettings, SocialLink } from './schemas';

@Injectable()
export class EducationService extends BaseCrudService {
  constructor(@InjectModel(Education.name) model: Model<Education>, cloudinary: CloudinaryService) {
    super(model, 'Education entry', cloudinary);
  }
}

@Injectable()
export class ExperienceService extends BaseCrudService {
  constructor(@InjectModel(Experience.name) model: Model<Experience>, cloudinary: CloudinaryService) {
    super(model, 'Experience entry', cloudinary);
  }
}

@Injectable()
export class ServicesService extends BaseCrudService {
  constructor(@InjectModel(ServiceItem.name) model: Model<ServiceItem>, cloudinary: CloudinaryService) {
    super(model, 'Service', cloudinary);
  }
}

@Injectable()
export class SocialLinksService extends BaseCrudService {
  constructor(@InjectModel(SocialLink.name) model: Model<SocialLink>, cloudinary: CloudinaryService) {
    super(model, 'Social link', cloudinary);
  }
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private readonly model: Model<Profile>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async get() {
    return (await this.model.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { upsert: true, new: true }).lean().exec())!;
  }

  async update(data: Record<string, unknown>) {
    const current = await this.model.findOne({ key: 'main' }).exec();
    const oldAvatar = current?.avatarPublicId;
    const saved = await this.model
      .findOneAndUpdate({ key: 'main' }, { $set: data }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true })
      .lean()
      .exec();
    if (oldAvatar && oldAvatar !== saved!.avatarPublicId) await this.cloudinary.deleteImage(oldAvatar);
    return saved!;
  }
}

@Injectable()
export class SettingsService {
  constructor(@InjectModel(SiteSettings.name) private readonly model: Model<SiteSettings>) {}

  async get() {
    return (await this.model.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { upsert: true, new: true }).lean().exec())!;
  }

  async update(data: Record<string, unknown>) {
    // Flatten nested objects to dot paths so partial section updates do not wipe sibling flags.
    const flat: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [inner, innerValue] of Object.entries(value)) flat[`${key}.${inner}`] = innerValue;
      } else flat[key] = value;
    }
    return (await this.model
      .findOneAndUpdate({ key: 'main' }, { $set: flat }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true })
      .lean()
      .exec())!;
  }
}
