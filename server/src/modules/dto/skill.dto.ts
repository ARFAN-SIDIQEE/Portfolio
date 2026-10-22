import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSkillDto {
  @IsString() @MaxLength(80)
  name!: string;

  @IsIn(['Technical', 'Soft'])
  category!: 'Technical' | 'Soft';

  @IsOptional() @IsString() @MaxLength(80)
  icon?: string;
}

export class UpdateSkillDto {
  @IsOptional() @IsString() @MaxLength(80)
  name?: string;

  @IsOptional() @IsIn(['Technical', 'Soft'])
  category?: 'Technical' | 'Soft';

  @IsOptional() @IsString() @MaxLength(80)
  icon?: string;
}
