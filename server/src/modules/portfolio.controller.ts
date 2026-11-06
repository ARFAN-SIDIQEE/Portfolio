import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  EducationService, ExperienceService, ProfileService, ServicesService, SettingsService, SocialLinksService,
} from '../content/content.services';
import { OrphanCleanupService } from '../cloudinary/orphan-cleanup.service';
import { AdminGuard } from './admin.guard';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { ParseObjectIdPipe } from './parse-object-id.pipe';
import { PortfolioService } from './portfolio.service';

@Controller()
export class PortfolioController {
  constructor(
    private readonly portfolio: PortfolioService,
    private readonly profile: ProfileService,
    private readonly settings: SettingsService,
    private readonly education: EducationService,
    private readonly experience: ExperienceService,
    private readonly services: ServicesService,
    private readonly socialLinks: SocialLinksService,
    private readonly orphans: OrphanCleanupService,
  ) {}

  /** Everything the public site needs, in one request. */
  @Get('portfolio')
  async getPortfolio() {
    const [profile, settings, projects, skills, services, education, experience, socialLinks] = await Promise.all([
      this.profile.get(),
      this.settings.get(),
      this.portfolio.getProjects(),
      this.portfolio.getSkills(),
      this.services.list(),
      this.education.list(),
      this.experience.list(),
      this.socialLinks.list(),
    ]);
    return { profile, settings, projects, skills, services, education, experience, socialLinks };
  }

  /** Admin: delete Cloudinary images no project/profile references (older than the grace period). */
  @Post('uploads/cleanup')
  @UseGuards(AdminGuard)
  cleanupUploads() {
    return this.orphans.sweep();
  }

  @Get('projects')
  getProjects() {
    return this.portfolio.getProjects();
  }

  @Post('projects')
  @UseGuards(AdminGuard)
  createProject(@Body() body: CreateProjectDto) {
    return this.portfolio.createProject(body);
  }

  @Patch('projects/:id')
  @UseGuards(AdminGuard)
  updateProject(@Param('id', ParseObjectIdPipe) id: string, @Body() body: UpdateProjectDto) {
    return this.portfolio.updateProject(id, body);
  }

  @Delete('projects/:id')
  @UseGuards(AdminGuard)
  deleteProject(@Param('id', ParseObjectIdPipe) id: string) {
    return this.portfolio.deleteProject(id);
  }

  @Get('skills')
  getSkills() {
    return this.portfolio.getSkills();
  }

  @Post('skills')
  @UseGuards(AdminGuard)
  createSkill(@Body() body: CreateSkillDto) {
    return this.portfolio.createSkill(body);
  }

  @Patch('skills/:id')
  @UseGuards(AdminGuard)
  updateSkill(@Param('id', ParseObjectIdPipe) id: string, @Body() body: UpdateSkillDto) {
    return this.portfolio.updateSkill(id, body);
  }

  @Delete('skills/:id')
  @UseGuards(AdminGuard)
  deleteSkill(@Param('id', ParseObjectIdPipe) id: string) {
    return this.portfolio.deleteSkill(id);
  }
}
