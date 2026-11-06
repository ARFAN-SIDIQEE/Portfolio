import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Project } from './schemas/project.schema';
import { Skill } from './schemas/skill.schema';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectModel(Project.name) private readonly projects: Model<Project>,
    @InjectModel(Skill.name) private readonly skills: Model<Skill>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  getProjects() {
    return this.projects.find().sort({ order: 1, createdAt: -1 }).lean().exec();
  }

  createProject(data: CreateProjectDto) {
    return this.projects.create(data);
  }

  async updateProject(id: string, data: UpdateProjectDto) {
    const existing = await this.projects.findById(id).exec();
    if (!existing) throw new NotFoundException('Project not found.');
    const oldImage = existing.imagePublicId;
    existing.set(data);
    const project = await existing.save();
    if (oldImage && oldImage !== project.imagePublicId) await this.cloudinary.deleteImage(oldImage);
    return project;
  }

  async deleteProject(id: string) {
    const project = await this.projects.findByIdAndDelete(id).exec();
    if (!project) throw new NotFoundException('Project not found.');
    await this.cloudinary.deleteImage(project.imagePublicId);
    return { deleted: true };
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
