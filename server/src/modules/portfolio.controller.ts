import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { ParseObjectIdPipe } from './parse-object-id.pipe';
import { PortfolioService } from './portfolio.service';

@Controller()
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

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
