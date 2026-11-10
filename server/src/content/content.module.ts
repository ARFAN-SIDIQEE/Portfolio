import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EducationController, ExperienceController, ProfileController, ServicesController, SettingsController, SocialLinksController,
} from './content.controllers';
import { EducationService, ExperienceService, ProfileService, ServicesService, SettingsService, SocialLinksService } from './content.services';
import {
  Education, EducationSchema, Experience, ExperienceSchema, Profile, ProfileSchema,
  ServiceItem, ServiceItemSchema, SiteSettings, SiteSettingsSchema, SocialLink, SocialLinkSchema,
} from './schemas';

const services = [EducationService, ExperienceService, ServicesService, SocialLinksService, ProfileService, SettingsService];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Education.name, schema: EducationSchema },
      { name: Experience.name, schema: ExperienceSchema },
      { name: ServiceItem.name, schema: ServiceItemSchema },
      { name: SocialLink.name, schema: SocialLinkSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: SiteSettings.name, schema: SiteSettingsSchema },
    ]),
  ],
  controllers: [EducationController, ExperienceController, ServicesController, SocialLinksController, ProfileController, SettingsController],
  providers: services,
  exports: services,
})
export class ContentModule {}
