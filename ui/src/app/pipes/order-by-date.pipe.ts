import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderByDate',
  standalone: true
})
export class OrderByDatePipe implements PipeTransform {
  transform(interviews: any[]): any[] {
    if (!interviews || !Array.isArray(interviews)) {
      return [];
    }
    
    return [...interviews].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB; // Ascending order (earliest first)
    });
  }
}
