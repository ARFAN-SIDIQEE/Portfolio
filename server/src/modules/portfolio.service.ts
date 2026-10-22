import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { Project } from './schemas/project.schema';
import { Skill } from './schemas/skill.schema';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectModel(Project.name) private readonly projects: Model<Project>,
    @InjectModel(Skill.name) private readonly skills: Model<Skill>,
  ) {}

  getProjects() {
    return this.projects.find().sort({ createdAt: -1 }).lean().exec();
  }

  createProject(data: CreateProjectDto) {
    return this.projects.create(data);
  }

  async updateProject(id: string, data: UpdateProjectDto) {
    const project = await this.projects.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
    if (!project) throw new NotFoundException('Project not found.');
    return project;
  }

  getSkills() {
    return this.skills.find().sort({ category: 1, name: 1 }).lean().exec();
  }

  createSkill(data: CreateSkillDto) {
    return this.skills.create(data);
  }

  async updateSkill(id: string, data: UpdateSkillDto) {
    const skill = await this.skills.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
    if (!skill) throw new NotFoundException('Skill not found.');
    return skill;
  }

  async deleteSkill(id: string) {
    const skill = await this.skills.findByIdAndDelete(id).exec();
    if (!skill) throw new NotFoundException('Skill not found.');
    return { deleted: true };
  }

  async hasProjects() {
    return (await this.projects.estimatedDocumentCount()) > 0;
  }

  async hasSkills() {
    return (await this.skills.estimatedDocumentCount()) > 0;
  }

  async seedProjects(projects: CreateProjectDto[]) {
    await this.projects.insertMany(projects);
  }

  async seedSkills(skills: CreateSkillDto[]) {
    await this.skills.insertMany(skills);
  }
}
