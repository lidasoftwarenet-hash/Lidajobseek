import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProcessesService } from '../../services/processes.service';

@Component({
    selector: 'app-process-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './process-list.component.html'
})
export class ProcessListComponent implements OnInit {
    processes: any[] = [];
    processesOnActioin: any[] = [];
    filteredProcesses: any[] = [];
    tasks: any[] = [];
    
    // Sorting properties
    sortColumn: string = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Filter properties
    searchText: string = '';
    selectedStages: string[] = [];
    selectedWorkModes: string[] = [];
    locationText: string = '';
    techStackText: string = '';
    showAllProcesses: boolean = false;
    minInteractions: number | null = null;
    maxInteractions: number | null = null;

    // Available options for filters
    availableStages: string[] = [
        'Initial Call Scheduled',
        'Awaiting Next Interview (after Initial Call)',
        'Interview Scheduled',
        'Waiting for Interview Feedback',
        'Home Task Assigned',
        'References Requested',
        'Final HR Interview Scheduled',
        'Offer Received',
        'Withdrawn',
        'Rejected',
        'No Response (14+ Days)'
    ];
    
    availableWorkModes: string[] = ['remote', 'hybrid', 'onsite'];

    constructor(private processesService: ProcessesService) { }

    ngOnInit() {
        this.processesService.getAll().subscribe(data => {
            this.processes = data;
            this.processesOnActioin = data.filter((p: any) => p.currentStage !== 'Rejected' && p.currentStage !== 'Withdrawn');
            this.applyFilters(); // Apply filters on initial load
            this.findTasks();
        });
    }

    findTasks() {
        const today = new Date();
        this.tasks = this.processes
            .filter(p => p.nextFollowUp && new Date(p.nextFollowUp) <= today)
            .map(p => ({
                id: p.id,
                company: p.companyName,
                action: 'Follow-up required',
                date: p.nextFollowUp
            }));
    }


    // Apply filters
    applyFilters() {
        this.filteredProcesses = this.processes.filter(process => {
            // Search text filter
            if (this.searchText) {
                const searchLower = this.searchText.toLowerCase();
                const matchesSearch = 
                    process.companyName?.toLowerCase().includes(searchLower) ||
                    process.roleTitle?.toLowerCase().includes(searchLower) ||
                    process.techStack?.toLowerCase().includes(searchLower) ||
                    process.location?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            // Stage filter
            if (this.selectedStages.length > 0 && !this.selectedStages.includes(process.currentStage)) {
                return false;
            }

            // Work mode filter
            if (this.selectedWorkModes.length > 0 && !this.selectedWorkModes.includes(process.workMode)) {
                return false;
            }

            // Location text filter
            if (this.locationText) {
                const locationLower = this.locationText.toLowerCase();
                if (!process.location?.toLowerCase().includes(locationLower)) {
                    return false;
                }
            }

            // Tech stack text filter
            if (this.techStackText) {
                const techLower = this.techStackText.toLowerCase();
                if (!process.techStack?.toLowerCase().includes(techLower)) {
                    return false;
                }
            }

            // Interactions count filter
            const interactionsCount = process._count?.interactions || 0;
            if (this.minInteractions !== null && interactionsCount < this.minInteractions) {
                return false;
            }
            if (this.maxInteractions !== null && interactionsCount > this.maxInteractions) {
                return false;
            }

            // Show all processes filter
            const isClosed = process.currentStage === 'Rejected' || process.currentStage === 'Withdrawn';
            if (!this.showAllProcesses && isClosed) {
                return false;
            }

            return true;
        });

        // Apply current sorting to filtered results
        if (this.sortColumn) {
            this.sort(this.sortColumn, true);
        }
    }

    // Clear all filters
    clearFilters() {
        this.searchText = '';
        this.selectedStages = [];
        this.selectedWorkModes = [];
        this.locationText = '';
        this.techStackText = '';
        this.showAllProcesses = false;
        this.minInteractions = null;
        this.maxInteractions = null;
        this.applyFilters(); // Apply filters after clearing
    }

    // Toggle filter selections
    toggleStage(stage: string) {
        const index = this.selectedStages.indexOf(stage);
        if (index === -1) {
            this.selectedStages.push(stage);
        } else {
            this.selectedStages.splice(index, 1);
        }
        this.applyFilters();
    }

    toggleWorkMode(mode: string) {
        const index = this.selectedWorkModes.indexOf(mode);
        if (index === -1) {
            this.selectedWorkModes.push(mode);
        } else {
            this.selectedWorkModes.splice(index, 1);
        }
        this.applyFilters();
    }

    getStatusClass(stage: string): string {
        if (!stage) return '';
        return 'status-' + stage.toLowerCase().replace(' ', '-');
    }

    // Sorting method
    sort(column: string, skipFilteredUpdate: boolean = false) {
        if (this.sortColumn === column) {
            // Toggle direction if same column
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // New column, default to ascending
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        const arrayToSort = skipFilteredUpdate ? this.filteredProcesses : this.processes;
        
        arrayToSort.sort((a, b) => {
            let aValue = this.getSortValue(a, column);
            let bValue = this.getSortValue(b, column);

            // Handle null/undefined values
            if (aValue == null) return this.sortDirection === 'asc' ? 1 : -1;
            if (bValue == null) return this.sortDirection === 'asc' ? -1 : 1;

            // Compare based on type
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return this.sortDirection === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else {
                // Numeric or date comparison
                return this.sortDirection === 'asc'
                    ? (aValue > bValue ? 1 : -1)
                    : (aValue < bValue ? 1 : -1);
            }
        });

        if (!skipFilteredUpdate) {
            this.filteredProcesses = [...arrayToSort];
        }
    }

    // Helper to get sort value based on column
    private getSortValue(process: any, column: string): any {
        switch (column) {
            case 'company':
                return process.companyName?.toLowerCase();
            case 'stage':
                return process.currentStage?.toLowerCase();
            case 'interactions':
                return process._count?.interactions || 0;
            case 'location':
                return process.location?.toLowerCase();
            case 'updated':
                return new Date(process.updatedAt);
            default:
                return null;
        }
    }

    // Check if column is currently sorted
    isSorted(column: string): boolean {
        return this.sortColumn === column;
    }

    // Get sort direction for a column
    getSortDirection(column: string): 'asc' | 'desc' | null {
        return this.isSorted(column) ? this.sortDirection : null;
    }

    // Helper to check if any filter is active
    get isFilterActive(): boolean {
        return !!this.searchText || 
               this.selectedStages.length > 0 ||
               this.selectedWorkModes.length > 0 ||
               !!this.locationText ||
               !!this.techStackText ||
               this.minInteractions !== null ||
               this.maxInteractions !== null ||
               this.showAllProcesses;
    }

    // Get count of active filters
    get activeFilterCount(): number {
        let count = 0;
        if (this.searchText) count++;
        count += this.selectedStages.length;
        count += this.selectedWorkModes.length;
        if (this.locationText) count++;
        if (this.techStackText) count++;
        if (this.minInteractions !== null) count++;
        if (this.maxInteractions !== null) count++;
        if (this.showAllProcesses) count++;
        return count;
    }
}
