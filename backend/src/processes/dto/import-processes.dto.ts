import { IsArray, IsIn, IsObject } from 'class-validator';

export class ImportProcessesDto {
  @IsArray()
  @IsObject({ each: true })
  processes!: Record<string, unknown>[];

  @IsIn(['overwrite', 'append'])
  mode!: 'overwrite' | 'append';
}