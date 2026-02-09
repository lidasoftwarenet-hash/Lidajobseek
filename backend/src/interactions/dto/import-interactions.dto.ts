import { IsArray, IsIn, IsObject } from 'class-validator';

export class ImportInteractionsDto {
  @IsArray()
  @IsObject({ each: true })
  interactions!: Record<string, unknown>[];

  @IsIn(['overwrite', 'append'])
  mode!: 'overwrite' | 'append';
}