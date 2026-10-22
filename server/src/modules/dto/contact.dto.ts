import { IsEmail, IsString, MaxLength } from 'class-validator';

export class ContactDto {
  @IsString() @MaxLength(80)
  name!: string;

  @IsEmail() @MaxLength(254)
  email!: string;

  @IsString() @MaxLength(5000)
  message!: string;
}
