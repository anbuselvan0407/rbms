import { IsEmail, IsNotEmpty, IsIn } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsIn(['candidate', 'employee'])
  type: 'candidate' | 'employee'; 
}
