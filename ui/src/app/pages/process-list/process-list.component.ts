import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProcessesService } from '../../services/processes.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { AuthService } from '../../services/auth.service';

interface FilterPreset {
    name: string;
    icon: string;
    filters: {
        searchText?: string;
        deepSearch?: string;
        selectedStage?: string;
        selectedWorkMode?: string;
        selectedLocation?: string;
        selectedSource?: string;
        salaryMin?: number;
        salaryMax?: number;
        showAllProcesses?: boolean;
    };
}

@Component({
    selector: 'app-process-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './process-list.component.html',
    styleUrls: ['./process-list.component.css']
})
export class ProcessListComponent implements OnInit {
    userName: string = 'Your';
    processes: any[] = [];
    processesOnActioin: any[] = [];
    filteredProcesses: any[] = [];
    tasks: any[] = [];
    isLoading: boolean = true;

    // Sorting properties
    sortColumn: string = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Filter properties
    searchText: string = '';
    companyText: string = '';
    deepSearch: string = '';
    selectedStage: string = '';
    selectedWorkMode: string = '';
    selectedLocation: string = '';
    selectedSource: string = '';
    salaryMin: number | null = null;
    salaryMax: number | null = null;
    showAllProcesses: boolean = false;

    // Date range filters
    dateFilterType: string = ''; // 'created' or 'updated'
    dateFrom: string = '';
    dateTo: string = '';

    // View mode
    viewMode: 'grid' | 'table' = 'grid';

    // Focus states for search blur
    searchFocused: boolean = false;
    deepSearchFocused: boolean = false;

    // Available options for filters (dynamically populated)
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
    availableLocations: string[] = [];
    availableSources: string[] = [];

    // Filter presets
    filterPresets: FilterPreset[] = [
        {
            name: 'Active',
            icon: '⚡',
            filters: {
                showAllProcesses: false,
                selectedStage: ''
            }
        },
        {
            name: 'Interviews',
            icon: '📅',
            filters: {
                selectedStage: 'Interview Scheduled'
            }
        },
        {
            name: 'Offers',
            icon: '🎯',
            filters: {
                selectedStage: 'Offer Received'
            }
        },
        {
            name: 'Remote',
            icon: '🏠',
            filters: {
                selectedWorkMode: 'remote'
            }
        },
        {
            name: 'High Priority',
            icon: '⭐',
            filters: {
                showAllProcesses: false
            }
        }
    ];

    // Show/hide filters panel on mobile
    showFiltersPanel: boolean = true;

    constructor(
        private processesService: ProcessesService,
        private toastService: ToastService,
        private confirmService: ConfirmService,
        private authService: AuthService,
    ) { }

    ngOnInit() {
        const user = this.authService.getUser();
        const normalizedName = user?.name?.trim();
        if (normalizedName) {
            this.userName = normalizedName;
        }

        this.isLoading = true;
        this.processesService.getAll().subscribe({
            next: (data) => {
                this.processes = data;
                this.processesOnActioin = data.filter((p: any) => p.currentStage !== 'Rejected' && p.currentStage !== 'Withdrawn');

                // Extract unique locations and sources
                this.extractFilterOptions();

                this.applyFilters();
                this.findTasks();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load processes', err);
                if (err?.status !== 401) {
                    this.toastService.show('Failed to load processes', 'error');
                }
                this.isLoading = false;
            }
        });

        // Load saved view mode
        const savedViewMode = localStorage.getItem('processViewMode');
        if (savedViewMode === 'grid' || savedViewMode === 'table') {
            this.viewMode = savedViewMode;
        }
    }

    // Extract unique filter options from data
    extractFilterOptions() {
        const locations = new Set<string>();
        const sources = new Set<string>();

        this.processes.forEach(p => {
            if (p.location) locations.add(p.location);
            if (p.source) sources.add(p.source);
        });

        this.availableLocations = Array.from(locations).sort();
        this.availableSources = Array.from(sources).sort();
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

    exportData() {
        this.processesService.exportData().subscribe({
            next: (data) => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `jobseek-export-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
                this.toastService.show('Export successful', 'success');
            },
            error: (err) => {
                console.error('Export failed', err);
                this.toastService.show('Export failed', 'error');
            }
        });
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e: any) => {
            try {
                const processes = JSON.parse(e.target.result);

                const mode = await this.confirmService.custom({
                    title: 'Import Data',
                    message: 'How would you like to import the data?',
                    buttons: [
                        { text: 'Append', value: 'append', class: 'btn-secondary' },
                        { text: 'Overwrite', value: 'overwrite', class: 'btn-danger' },
                        { text: 'Cancel', value: null, class: 'btn-secondary' }
                    ]
                });

                if (!mode) return;

                this.processesService.importData(processes, mode).subscribe({
                    next: () => {
                        this.toastService.show('Import successful', 'success');
                        this.ngOnInit();
                    },
                    error: (err) => {
                        console.error('Import failed', err);
                        this.toastService.show('Import failed', 'error');
                    }
                });
            } catch (err) {
                console.error('Invalid file', err);
                this.toastService.show('Invalid JSON file', 'error');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
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
                    process.location?.toLowerCase().includes(searchLower) ||
                    process.source?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            // Company free text filter
            if (this.companyText) {
                const companyLower = this.companyText.toLowerCase();
                const matchesCompany = process.companyName?.toLowerCase().includes(companyLower);
                if (!matchesCompany) return false;
            }

            // Deep search (within process content)
            if (this.deepSearch) {
                const searchLower = this.deepSearch.toLowerCase();

                // Search in process internal fields
                const matchesProcess =
                    process.dataFromThePhoneCall?.toLowerCase().includes(searchLower) ||
                    process.initialInviteContent?.toLowerCase().includes(searchLower) ||
                    process.headsup?.toLowerCase().includes(searchLower) ||
                    process.notes?.toLowerCase().includes(searchLower) ||
                    process.benefits?.toLowerCase().includes(searchLower) ||
                    process.equity?.toLowerCase().includes(searchLower) ||
                    process.bonus?.toLowerCase().includes(searchLower);

                // Search in interactions
                const matchesInteractions = process.interactions?.some((i: any) =>
                    i.summary?.toLowerCase().includes(searchLower) ||
                    i.notes?.toLowerCase().includes(searchLower) ||
                    i.headsup?.toLowerCase().includes(searchLower) ||
                    i.testsAssessment?.toLowerCase().includes(searchLower) ||
                    i.roleInsights?.toLowerCase().includes(searchLower) ||
                    i.meetingLink?.toLowerCase().includes(searchLower)
                );

                // Search in reviews
                const matchesReviews = process.reviews?.some((r: any) =>
                    r.pros?.toLowerCase().includes(searchLower) ||
                    r.cons?.toLowerCase().includes(searchLower) ||
                    r.vibeSummary?.toLowerCase().includes(searchLower)
                );

                // Search in contacts
                const matchesContacts = process.contacts?.some((c: any) =>
                    c.name?.toLowerCase().includes(searchLower) ||
                    c.role?.toLowerCase().includes(searchLower) ||
                    c.email?.toLowerCase().includes(searchLower) ||
                    c.socialHooks?.toLowerCase().includes(searchLower)
                );

                if (!(matchesProcess || matchesInteractions || matchesReviews || matchesContacts)) return false;
            }

            // Stage filter
            if (this.selectedStage && process.currentStage !== this.selectedStage) {
                return false;
            }

            // Work mode filter
            if (this.selectedWorkMode && process.workMode !== this.selectedWorkMode) {
                return false;
            }

            // Location filter
            if (this.selectedLocation && process.location !== this.selectedLocation) {
                return false;
            }

            // Source filter
            if (this.selectedSource && process.source !== this.selectedSource) {
                return false;
            }

            // Salary range filter
            if (this.salaryMin !== null || this.salaryMax !== null) {
                const salary = process.salaryExpectation;
                if (salary) {
                    if (this.salaryMin !== null && salary < this.salaryMin) return false;
                    if (this.salaryMax !== null && salary > this.salaryMax) return false;
                } else if (this.salaryMin !== null || this.salaryMax !== null) {
                    return false;
                }
            }

            // Date range filter
            if (this.dateFilterType && (this.dateFrom || this.dateTo)) {
                const dateField = this.dateFilterType === 'created' ? process.createdAt : process.updatedAt;
                const processDate = new Date(dateField);

                if (this.dateFrom && processDate < new Date(this.dateFrom)) return false;
                if (this.dateTo) {
                    const toDate = new Date(this.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (processDate > toDate) return false;
                }
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
        this.companyText = '';
        this.deepSearch = '';
        this.selectedStage = '';
        this.selectedWorkMode = '';
        this.selectedLocation = '';
        this.selectedSource = '';
        this.salaryMin = null;
        this.salaryMax = null;
        this.dateFilterType = '';
        this.dateFrom = '';
        this.dateTo = '';
        this.showAllProcesses = false;
        this.applyFilters();
    }

    // Apply filter preset
    applyPreset(preset: FilterPreset) {
        this.clearFilters();
        Object.assign(this, preset.filters);
        this.applyFilters();
        this.toastService.show(`Applied "${preset.name}" filter`, 'info');
    }

    // Toggle view mode
    toggleViewMode() {
        this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
        localStorage.setItem('processViewMode', this.viewMode);
    }

    // Toggle filters panel
    toggleFiltersPanel() {
        this.showFiltersPanel = !this.showFiltersPanel;
    }

    handleSearchBlur() {
        setTimeout(() => this.searchFocused = false, 200);
    }

    handleDeepSearchBlur() {
        setTimeout(() => this.deepSearchFocused = false, 200);
    }

    onStageChange(event: any) {
        this.selectedStage = event.target.value;
        this.applyFilters();
    }

    onWorkModeChange(event: any) {
        this.selectedWorkMode = event.target.value;
        this.applyFilters();
    }

    onLocationChange(event: any) {
        this.selectedLocation = event.target.value;
        this.applyFilters();
    }

    onSourceChange(event: any) {
        this.selectedSource = event.target.value;
        this.applyFilters();
    }

    getStatusClass(stage: string): string {
        if (!stage) return '';
        return 'status-' + stage.toLowerCase().replace(/\s+/g, '-');
    }

    // Sorting method
    sort(column: string, skipFilteredUpdate: boolean = false) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        const arrayToSort = skipFilteredUpdate ? this.filteredProcesses : this.processes;

        arrayToSort.sort((a, b) => {
            let aValue = this.getSortValue(a, column);
            let bValue = this.getSortValue(b, column);

            if (aValue == null) return this.sortDirection === 'asc' ? 1 : -1;
            if (bValue == null) return this.sortDirection === 'asc' ? -1 : 1;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return this.sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else {
                return this.sortDirection === 'asc'
                    ? (aValue > bValue ? 1 : -1)
                    : (aValue < bValue ? 1 : -1);
            }
        });

        if (!skipFilteredUpdate) {
            this.filteredProcesses = [...arrayToSort];
        }
    }

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
            case 'salary':
                return process.salaryExpectation || 0;
            case 'updated':
                return new Date(process.updatedAt);
            case 'created':
                return new Date(process.createdAt);
            default:
                return null;
        }
    }

    isSorted(column: string): boolean {
        return this.sortColumn === column;
    }

    getSortDirection(column: string): 'asc' | 'desc' | null {
        return this.isSorted(column) ? this.sortDirection : null;
    }

    get isFilterActive(): boolean {
        return !!this.searchText ||
            !!this.companyText ||
            !!this.deepSearch ||
            !!this.selectedStage ||
            !!this.selectedWorkMode ||
            !!this.selectedLocation ||
            !!this.selectedSource ||
            this.salaryMin !== null ||
            this.salaryMax !== null ||
            !!this.dateFilterType ||
            this.showAllProcesses;
    }

    get activeFilterCount(): number {
        let count = 0;
        if (this.searchText) count++;
        if (this.companyText) count++;
        if (this.deepSearch) count++;
        if (this.selectedStage) count++;
        if (this.selectedWorkMode) count++;
        if (this.selectedLocation) count++;
        if (this.selectedSource) count++;
        if (this.salaryMin !== null || this.salaryMax !== null) count++;
        if (this.dateFilterType) count++;
        if (this.showAllProcesses) count++;
        return count;
    }

    getActiveCount(): number {
        return this.filteredProcesses.filter(p =>
            !['Rejected', 'Withdrawn', 'Offer', 'Signed'].includes(p.currentStage)
        ).length;
    }

    getInterviewCount(): number {
        return this.filteredProcesses.filter(p =>
            ['Interview Scheduled', 'Technical Interview', 'Final Interview', 'Final HR Interview Scheduled'].includes(p.currentStage)
        ).length;
    }

    getOfferCount(): number {
        return this.filteredProcesses.filter(p =>
            ['Offer Received', 'Signed'].includes(p.currentStage)
        ).length;
    }

    get processTitle(): string {
        return `${this.userName} Process`;
    }
}
