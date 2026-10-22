import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString() @MaxLength(120)
  title!: string;

  @IsString() @MaxLength(2000)
  description!: string;

  @IsArray() @IsString({ each: true })
  technologies!: string[];

  @IsIn(['completed', 'in-progress'])
  status!: 'completed' | 'in-progress';

  @IsOptional() @IsString() @MaxLength(80)
  category?: string;

  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional() @IsUrl({ require_protocol: true })
  sourceUrl?: string;

  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional() @IsUrl({ require_protocol: true })
  liveUrl?: string;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @MaxLength(120)
  title?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  technologies?: string[];

  @IsOptional() @IsIn(['completed', 'in-progress'])
  status?: 'completed' | 'in-progress';

  @IsOptional() @IsString() @MaxLength(80)
  category?: string;

  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional() @IsUrl({ require_protocol: true })
  sourceUrl?: string;

  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional() @IsUrl({ require_protocol: true })
  liveUrl?: string;
}
