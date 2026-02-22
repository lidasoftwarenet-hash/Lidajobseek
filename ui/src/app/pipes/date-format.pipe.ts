import { Pipe, PipeTransform } from '@angular/core';
import { SettingsService } from '../services/settings.service';

/**
 * A pipe that formats dates according to user preferences.
 * Usage: {{ date | dateFormat }}
 *         {{ date | dateFormat:'datetime' }}
 *         {{ date | dateFormat:'date' }}
 *         {{ date | dateFormat:'time' }}
 */
@Pipe({
  name: 'dateFormat',
  standalone: true,
  pure: false // Make it impure to react to settings changes
})
export class DateFormatPipe implements PipeTransform {
  constructor(private settingsService: SettingsService) {}

  transform(value: string | Date | null | undefined, format: 'date' | 'time' | 'datetime' = 'datetime'): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }

    const settings = this.settingsService.getSettings();
    const dateFormat = settings.dateFormat || 'DD/MM/YYYY';
    const timeFormat = settings.clockFormat || '24';

    if (format === 'date') {
      return this.formatDate(date, dateFormat);
    }

    if (format === 'time') {
      return this.formatTime(date, timeFormat);
    }

    // Default to datetime
    return `${this.formatDate(date, dateFormat)}, ${this.formatTime(date, timeFormat)}`;
  }

  private formatDate(date: Date, format: string): string {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Pad with zeros
    const dd = day.toString().padStart(2, '0');
    const mm = month.toString().padStart(2, '0');
    const yyyy = year.toString();

    switch (format) {
      case 'MM/DD/YYYY':
        return `${mm}/${dd}/${yyyy}`;
      case 'DD/MM/YYYY':
        return `${dd}/${mm}/${yyyy}`;
      case 'YYYY-MM-DD':
        return `${yyyy}-${mm}-${dd}`;
      case 'YYYY/MM/DD':
        return `${yyyy}/${mm}/${dd}`;
      case 'DD-MM-YYYY':
        return `${dd}-${mm}-${yyyy}`;
      case 'MM-DD-YYYY':
        return `${mm}-${dd}-${yyyy}`;
      case 'DD.MM.YYYY':
        return `${dd}.${mm}.${yyyy}`;
      case 'MM.DD.YYYY':
        return `${mm}.${dd}.${yyyy}`;
      case 'YYYY.MM.DD':
        return `${yyyy}.${mm}.${dd}`;
      default:
        return `${dd}/${mm}/${yyyy}`;
    }
  }

  private formatTime(date: Date, format: '12' | '24'): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();

    const mm = minutes.toString().padStart(2, '0');

    if (format === '12') {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${mm} ${period}`;
    }

    // 24-hour format
    const hh = hours.toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
