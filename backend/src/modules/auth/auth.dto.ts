import { IsString, IsUUID, IsEmail, IsOptional, Length, Matches, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterOptionsDto {
  @IsString()
  @Length(43, 43)
  inviteToken!: string;
}

export class RegisterVerifyDto {
  @IsString()
  @Length(43, 43)
  inviteToken!: string;

  @IsUUID()
  challengeId!: string;

  @IsObject()
  credential!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 50)
  credentialName?: string;
}

export class LoginOptionsDto {
  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;
}

export class LoginVerifyDto {
  @IsUUID()
  challengeId!: string;

  @IsObject()
  credential!: Record<string, unknown>;
}

export class TotpCodeDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
