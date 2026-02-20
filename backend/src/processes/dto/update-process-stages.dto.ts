import { IsArray, IsString } from 'class-validator';

export class UpdateProcessStagesDto {
  @IsArray()
  @IsString({ each: true })
  stages!: string[];
}
