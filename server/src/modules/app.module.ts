import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { Project, ProjectSchema } from './schemas/project.schema';
import { Skill, SkillSchema } from './schemas/skill.schema';
import { seedPortfolio } from './seed';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Skill.name, schema: SkillSchema },
    ]),
  ],
  controllers: [AuthController, ContactController, PortfolioController],
  providers: [PortfolioService, ContactService],
})
export class AppModule {
  constructor(private readonly portfolioService: PortfolioService) {}

  async onModuleInit() {
    await seedPortfolio(this.portfolioService);
  }
}
