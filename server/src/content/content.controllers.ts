import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../modules/admin.guard';
import { ParseObjectIdPipe } from '../modules/parse-object-id.pipe';
import {
  CreateEducationDto, CreateExperienceDto, CreateServiceDto, CreateSocialLinkDto,
  UpdateEducationDto, UpdateExperienceDto, UpdateProfileDto, UpdateServiceDto, UpdateSettingsDto, UpdateSocialLinkDto,
} from './dtos';
import { EducationService, ExperienceService, ProfileService, ServicesService, SettingsService, SocialLinksService } from './content.services';

// Reads are public; every write is behind AdminGuard.

@Controller('education')
export class EducationController {
  constructor(private readonly svc: EducationService) {}
  @Get() list() { return this.svc.list(); }
  @Post() @UseGuards(AdminGuard) create(@Body() b: CreateEducationDto) { return this.svc.create({ ...b }); }
  @Patch(':id') @UseGuards(AdminGuard) update(@Param('id', ParseObjectIdPipe) id: string, @Body() b: UpdateEducationDto) { return this.svc.update(id, { ...b }); }
  @Delete(':id') @UseGuards(AdminGuard) remove(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.remove(id); }
}

@Controller('experience')
export class ExperienceController {
  constructor(private readonly svc: ExperienceService) {}
  @Get() list() { return this.svc.list(); }
  @Post() @UseGuards(AdminGuard) create(@Body() b: CreateExperienceDto) { return this.svc.create({ ...b }); }
  @Patch(':id') @UseGuards(AdminGuard) update(@Param('id', ParseObjectIdPipe) id: string, @Body() b: UpdateExperienceDto) { return this.svc.update(id, { ...b }); }
  @Delete(':id') @UseGuards(AdminGuard) remove(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.remove(id); }
}

@Controller('services')
export class ServicesController {
  constructor(private readonly svc: ServicesService) {}
  @Get() list() { return this.svc.list(); }
  @Post() @UseGuards(AdminGuard) create(@Body() b: CreateServiceDto) { return this.svc.create({ ...b }); }
  @Patch(':id') @UseGuards(AdminGuard) update(@Param('id', ParseObjectIdPipe) id: string, @Body() b: UpdateServiceDto) { return this.svc.update(id, { ...b }); }
  @Delete(':id') @UseGuards(AdminGuard) remove(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.remove(id); }
}

@Controller('social-links')
export class SocialLinksController {
  constructor(private readonly svc: SocialLinksService) {}
  @Get() list() { return this.svc.list(); }
  @Post() @UseGuards(AdminGuard) create(@Body() b: CreateSocialLinkDto) { return this.svc.create({ ...b }); }
  @Patch(':id') @UseGuards(AdminGuard) update(@Param('id', ParseObjectIdPipe) id: string, @Body() b: UpdateSocialLinkDto) { return this.svc.update(id, { ...b }); }
  @Delete(':id') @UseGuards(AdminGuard) remove(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.remove(id); }
}

@Controller('profile')
export class ProfileController {
  constructor(private readonly svc: ProfileService) {}
  @Get() get() { return this.svc.get(); }
  @Put() @UseGuards(AdminGuard) update(@Body() b: UpdateProfileDto) { return this.svc.update({ ...b }); }
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}
  @Get() get() { return this.svc.get(); }
  @Put() @UseGuards(AdminGuard) update(@Body() b: UpdateSettingsDto) { return this.svc.update(JSON.parse(JSON.stringify(b))); }
}
