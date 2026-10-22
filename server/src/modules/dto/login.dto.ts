import { IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString() @MaxLength(100)
  username!: string;

  @IsString() @MaxLength(200)
  password!: string;
}
