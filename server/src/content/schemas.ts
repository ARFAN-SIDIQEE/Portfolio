import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Education {
  @Prop({ required: true, trim: true, maxlength: 160 }) institution!: string;
  @Prop({ required: true, trim: true, maxlength: 160 }) degree!: string;
  @Prop({ trim: true, maxlength: 40, default: '' }) startDate!: string;
  @Prop({ trim: true, maxlength: 40, default: '' }) endDate!: string;
  @Prop({ trim: true, maxlength: 1500, default: '' }) description!: string;
  @Prop({ default: 0 }) order!: number;
}
export const EducationSchema = SchemaFactory.createForClass(Education);

@Schema({ timestamps: true })
export class Experience {
  @Prop({ required: true, trim: true, maxlength: 160 }) title!: string;
  @Prop({ trim: true, maxlength: 160, default: '' }) company!: string;
  @Prop({ trim: true, maxlength: 40, default: '' }) startDate!: string;
  @Prop({ trim: true, maxlength: 40, default: '' }) endDate!: string;
  @Prop({ trim: true, maxlength: 1500, default: '' }) description!: string;
  @Prop({ default: 0 }) order!: number;
}
export const ExperienceSchema = SchemaFactory.createForClass(Experience);

@Schema({ timestamps: true, collection: 'services' })
export class ServiceItem {
  @Prop({ required: true, trim: true, maxlength: 120 }) title!: string;
  @Prop({ required: true, trim: true, maxlength: 1000 }) description!: string;
  @Prop({ trim: true, maxlength: 80, default: 'fas fa-code' }) icon!: string;
  @Prop({ trim: true, maxlength: 40, default: 'Free' }) price!: string;
  @Prop({ default: 0 }) order!: number;
}
export const ServiceItemSchema = SchemaFactory.createForClass(ServiceItem);

@Schema({ timestamps: true })
export class SocialLink {
  @Prop({ required: true, trim: true, maxlength: 60 }) platform!: string;
  @Prop({ required: true, trim: true, maxlength: 500 }) url!: string;
  @Prop({ trim: true, maxlength: 80, default: 'fas fa-link' }) icon!: string;
  @Prop({ default: 0 }) order!: number;
}
export const SocialLinkSchema = SchemaFactory.createForClass(SocialLink);

@Schema({ timestamps: true })
export class Profile {
  @Prop({ default: 'main', unique: true }) key!: string;
  @Prop({ trim: true, maxlength: 120, default: '' }) fullName!: string;
  @Prop({ trim: true, maxlength: 160, default: '' }) headline!: string;
  @Prop({ trim: true, maxlength: 160, default: '' }) badge!: string;
  @Prop({ trim: true, maxlength: 1000, default: '' }) heroDescription!: string;
  @Prop({ type: [String], default: [] }) aboutParagraphs!: string[];
  @Prop({ type: [{ value: String, label: String, icon: String, _id: false }], default: [] })
  aboutStats!: { value?: string; label?: string; icon?: string }[];
  @Prop({ trim: true, maxlength: 254, default: '' }) email!: string;
  @Prop({ trim: true, maxlength: 30, default: '' }) whatsapp!: string;
  @Prop({ trim: true, maxlength: 120, default: '' }) location!: string;
  @Prop({ trim: true, default: '' }) resumeUrl!: string;
  @Prop({ trim: true, default: '' }) avatarUrl!: string;
  @Prop({ trim: true, default: '' }) avatarPublicId!: string;
}
export const ProfileSchema = SchemaFactory.createForClass(Profile);

const flag = { type: Boolean, default: true };
@Schema({ timestamps: true })
export class SiteSettings {
  @Prop({ default: 'main', unique: true }) key!: string;
  @Prop({ trim: true, maxlength: 120, default: 'Portfolio' }) siteTitle!: string;
  @Prop({ trim: true, maxlength: 300, default: '' }) metaDescription!: string;
  @Prop({ trim: true, maxlength: 200, default: '' }) footerText!: string;
  @Prop({ trim: true, maxlength: 300, default: '' }) contactIntro!: string;
  @Prop({ trim: true, maxlength: 300, default: '' }) projectsFooterText!: string;
  @Prop({
    type: { about: flag, skills: flag, projects: flag, services: flag, experience: flag, education: flag, contact: flag, _id: false },
    default: {},
  })
  sections!: Record<string, boolean>;
  @Prop({
    type: { about: String, skills: String, projects: String, services: String, experience: String, education: String, contact: String, _id: false },
    default: {},
  })
  sectionTitles!: Record<string, string>;
}
export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);
