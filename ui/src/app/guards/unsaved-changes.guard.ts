import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { ConfirmService } from '../services/confirm.service';

export interface HasUnsavedChanges {
    hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
    if (component.hasUnsavedChanges()) {
        const confirmService = inject(ConfirmService);
        return confirmService.custom({
            title: '⚠️ Unsaved Changes Detected',
            message: 'Hey! Your data is gonna be lost if you move to another tab. All your changes will disappear. Are you sure you want to leave?',
            confirmText: 'Leave Page',
            cancelText: 'Stay Here',
            buttons: [
                { text: 'Stay Here', value: false, class: 'btn-secondary' },
                { text: 'Leave Page', value: true, class: 'btn-danger' }
            ]
        });
    }
    return true;
};
