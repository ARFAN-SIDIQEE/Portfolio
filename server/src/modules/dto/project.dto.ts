import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';

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

  @IsOptional() @ValidateIf((_o, value) => value !== '' && value !== undefined) @IsUrl({ require_protocol: true })
  sourceUrl?: string;

  @IsOptional() @ValidateIf((_o, value) => value !== '' && value !== undefined) @IsUrl({ require_protocol: true })
  liveUrl?: string;

  @IsOptional() @ValidateIf((_o, value) => value !== '' && value !== undefined) @IsUrl({ require_protocol: true })
  imageUrl?: string;

  @IsOptional() @IsString() @MaxLength(200)
  imagePublicId?: string;

  @IsOptional() @IsInt()
  order?: number;
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

  @IsOptional() @ValidateIf((_o, value) => value !== '' && value !== undefined) @IsUrl({ require_protocol: true })
  sourceUrl?: string;

  @IsOptional() @ValidateIf((_o, value) => value !== '' && value !== undefined) @IsUrl({ require_protocol: true })
  liveUrl?: string;

  @IsOptional() @ValidateIf((_o, value) => value !== '' && value !== undefined) @IsUrl({ require_protocol: true })
  imageUrl?: string;

  @IsOptional() @IsString() @MaxLength(200)
  imagePublicId?: string;

  @IsOptional() @IsInt()
  order?: number;
}
