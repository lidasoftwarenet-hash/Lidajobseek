import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filter',
    standalone: true
})
export class FilterPipe implements PipeTransform {
    transform(items: any[], categoryId: string): any[] {
        if (!items || !categoryId) {
            return [];
        }
        return items.filter(item => item.type === categoryId);
    }
}
