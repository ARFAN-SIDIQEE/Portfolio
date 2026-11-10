import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsString, Matches, MaxLength, ValidateIf, ValidateNested } from 'class-validator';

const LINK = /^(https?:\/\/|mailto:|tel:)\S+$/i;
const LINK_MESSAGE = 'must start with http://, https://, mailto: or tel:';

export class CreateEducationDto {
  @IsString() @MaxLength(160) institution!: string;
  @IsString() @MaxLength(160) degree!: string;
  @IsOptional() @IsString() @MaxLength(40) startDate?: string;
  @IsOptional() @IsString() @MaxLength(40) endDate?: string;
  @IsOptional() @IsString() @MaxLength(1500) description?: string;
  @IsOptional() @IsInt() order?: number;
}
export class UpdateEducationDto extends PartialType(CreateEducationDto) {}

export class CreateExperienceDto {
  @IsString() @MaxLength(160) title!: string;
  @IsOptional() @IsString() @MaxLength(160) company?: string;
  @IsOptional() @IsString() @MaxLength(40) startDate?: string;
  @IsOptional() @IsString() @MaxLength(40) endDate?: string;
  @IsOptional() @IsString() @MaxLength(1500) description?: string;
  @IsOptional() @IsInt() order?: number;
}
export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}

export class CreateServiceDto {
  @IsString() @MaxLength(120) title!: string;
  @IsString() @MaxLength(1000) description!: string;
  @IsOptional() @IsString() @MaxLength(80) icon?: string;
  @IsOptional() @IsString() @MaxLength(40) price?: string;
  @IsOptional() @IsInt() order?: number;
}
export class UpdateServiceDto extends PartialType(CreateServiceDto) {}

export class CreateSocialLinkDto {
  @IsString() @MaxLength(60) platform!: string;
  @IsString() @MaxLength(500) @Matches(LINK, { message: `url ${LINK_MESSAGE}` }) url!: string;
  @IsOptional() @IsString() @MaxLength(80) icon?: string;
  @IsOptional() @IsInt() order?: number;
}
export class UpdateSocialLinkDto extends PartialType(CreateSocialLinkDto) {}

class AboutStatDto {
  @IsOptional() @IsString() @MaxLength(20) value?: string;
  @IsOptional() @IsString() @MaxLength(60) label?: string;
  @IsOptional() @IsString() @MaxLength(80) icon?: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(120) fullName?: string;
  @IsOptional() @IsString() @MaxLength(160) headline?: string;
  @IsOptional() @IsString() @MaxLength(160) badge?: string;
  @IsOptional() @IsString() @MaxLength(1000) heroDescription?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(3000, { each: true }) aboutParagraphs?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AboutStatDto) aboutStats?: AboutStatDto[];
  @IsOptional() @ValidateIf((_o, value) => value !== '') @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MaxLength(30) whatsapp?: string;
  @IsOptional() @IsString() @MaxLength(120) location?: string;
  @IsOptional() @IsString() @MaxLength(500) resumeUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) avatarUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) avatarPublicId?: string;
}

class SectionFlagsDto {
  @IsOptional() @IsBoolean() about?: boolean;
  @IsOptional() @IsBoolean() skills?: boolean;
  @IsOptional() @IsBoolean() projects?: boolean;
  @IsOptional() @IsBoolean() services?: boolean;
  @IsOptional() @IsBoolean() experience?: boolean;
  @IsOptional() @IsBoolean() education?: boolean;
  @IsOptional() @IsBoolean() contact?: boolean;
}
class SectionTitlesDto {
  @IsOptional() @IsString() @MaxLength(80) about?: string;
  @IsOptional() @IsString() @MaxLength(80) skills?: string;
  @IsOptional() @IsString() @MaxLength(80) projects?: string;
  @IsOptional() @IsString() @MaxLength(80) services?: string;
  @IsOptional() @IsString() @MaxLength(80) experience?: string;
  @IsOptional() @IsString() @MaxLength(80) education?: string;
  @IsOptional() @IsString() @MaxLength(80) contact?: string;
}

export class UpdateSettingsDto {
  @IsOptional() @IsString() @MaxLength(120) siteTitle?: string;
  @IsOptional() @IsString() @MaxLength(300) metaDescription?: string;
  @IsOptional() @IsString() @MaxLength(200) footerText?: string;
  @IsOptional() @IsString() @MaxLength(300) contactIntro?: string;
  @IsOptional() @IsString() @MaxLength(300) projectsFooterText?: string;
  @IsOptional() @ValidateNested() @Type(() => SectionFlagsDto) sections?: SectionFlagsDto;
  @IsOptional() @ValidateNested() @Type(() => SectionTitlesDto) sectionTitles?: SectionTitlesDto;
}
