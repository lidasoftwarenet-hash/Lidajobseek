import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsIn(['light', 'dark', 'auto'])
  theme?: 'light' | 'dark' | 'auto';

  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(18)
  fontSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsIn([
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD',
    'YYYY/MM/DD',
    'DD-MM-YYYY',
    'MM-DD-YYYY',
    'DD.MM.YYYY',
    'MM.DD.YYYY',
    'YYYY.MM.DD',
  ])
  dateFormat?:
    | 'MM/DD/YYYY'
    | 'DD/MM/YYYY'
    | 'YYYY-MM-DD'
    | 'YYYY/MM/DD'
    | 'DD-MM-YYYY'
    | 'MM-DD-YYYY'
    | 'DD.MM.YYYY'
    | 'MM.DD.YYYY'
    | 'YYYY.MM.DD';

  @IsOptional()
  @IsIn(['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD', 'INR', 'RUB', 'ILS', 'RON'])
  salaryCurrency?: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'AUD' | 'CAD' | 'CHF' | 'HKD' | 'SGD' | 'INR' | 'RUB' | 'ILS' | 'RON';
}
