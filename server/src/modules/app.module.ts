import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoginThrottle } from '../common/rate-limit';
import { OrphanCleanupService } from '../cloudinary/orphan-cleanup.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ContentModule } from '../content/content.module';
import {
  EducationService, ExperienceService, ProfileService, ServicesService, SettingsService, SocialLinksService,
} from '../content/content.services';
import { AuthController } from './auth.controller';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { Project, ProjectSchema } from './schemas/project.schema';
import { Skill, SkillSchema } from './schemas/skill.schema';
import { Profile, ProfileSchema } from '../content/schemas';
import { seedPortfolio } from './seed';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI as string, {
      // Atlas URIs often omit the database name, which silently falls back to "test".
      dbName: process.env.MONGODB_DB_NAME || 'portfolio',
      serverSelectionTimeoutMS: 10000,
      retryAttempts: 2,
      retryDelay: 1000,
    }),
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Skill.name, schema: SkillSchema },
      { name: Profile.name, schema: ProfileSchema },
    ]),
    CloudinaryModule,
    ContentModule,
  ],
  controllers: [AuthController, ContactController, PortfolioController],
  providers: [PortfolioService, ContactService, LoginThrottle, OrphanCleanupService],
})
export class AppModule {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly profile: ProfileService,
    private readonly settings: SettingsService,
    private readonly education: EducationService,
    private readonly experience: ExperienceService,
    private readonly services: ServicesService,
    private readonly socialLinks: SocialLinksService,
  ) {}

  async onModuleInit() {
    await seedPortfolio(this.portfolioService, {
      profile: this.profile,
      settings: this.settings,
      education: this.education,
      experience: this.experience,
      services: this.services,
      socialLinks: this.socialLinks,
    });
  }
}
