import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ResourcesService } from '../../services/resources.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface Folder {
  id: number;
  name: string;
  parentId?: number;
  parent?: Folder;
}

interface DocumentItem {
  id: number;
  title: string;
  type: string;
  content: string;
  folderId?: number;
  updatedAt: string;
}

@Component({
  selector: 'app-coach-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './coach-hub.component.html',
  styleUrls: ['./coach-hub.component.css']
})
export class CoachHubComponent implements OnInit {
  allFolders: Folder[] = [];
  currentFolder: Folder | null = null;

  folders: Folder[] = [];
  documents: DocumentItem[] = [];

  isLoading = true;
  showNewFolderModal = false;
  newFolderName = '';

  // Breadcrumbs
  breadcrumbs: Folder[] = [];

  readonly MAX_FREE_DOCUMENTS = 5;
  isPremium = false;

  constructor(
    private resourcesService: ResourcesService,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.isPremium = this.authService.isPremiumUser();
    this.loadAllData();
  }

  loadAllData() {
    this.isLoading = true;
    // Load folders and files
    this.resourcesService.getFolders().subscribe({
      next: (folders) => {
        this.allFolders = folders;
        this.loadDocuments();
      },
      error: (err) => {
        this.toastService.show('Failed to load folders', 'error');
        this.isLoading = false;
      }
    });
  }

  loadDocuments() {
    this.resourcesService.getAll().subscribe({
      next: (docs) => {
        this.documents = docs;
        this.refreshView();
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.show('Failed to load documents', 'error');
        this.isLoading = false;
      }
    });
  }

  refreshView() {
    const currentId = this.currentFolder?.id || null;

    this.folders = this.allFolders.filter(f => {
      const parentId = f.parentId || (typeof f.parent === 'object' ? f.parent?.id : f.parent);
      if (currentId === null) return !parentId;
      return parentId === currentId;
    });

    this.updateBreadcrumbs();
  }

  getCurrentDocuments() {
    const currentId = this.currentFolder?.id || null;
    return this.documents.filter(d => {
      const docFolderId = d.folderId || (typeof (d as any).folder === 'object' ? (d as any).folder?.id : (d as any).folder);
      return (docFolderId || null) === currentId;
    });
  }

  updateBreadcrumbs() {
    const path: Folder[] = [];
    let curr = this.currentFolder;
    while (curr) {
      path.unshift(curr);
      const parentId = curr.parentId || (typeof curr.parent === 'object' ? curr.parent?.id : curr.parent);
      curr = parentId ? this.allFolders.find(f => f.id === parentId) || null : null;
    }
    this.breadcrumbs = path;
  }

  navigateToFolder(folder: Folder | null) {
    this.currentFolder = folder;
    this.refreshView();
  }

  createFolder() {
    if (!this.newFolderName.trim()) return;

    this.resourcesService.createFolder(this.newFolderName, this.currentFolder?.id).subscribe({
      next: (newFolder) => {
        // Ensure folder has parent info for filtering
        if (this.currentFolder) {
          newFolder.parentId = this.currentFolder.id;
        }
        this.allFolders.push(newFolder);
        this.newFolderName = '';
        this.showNewFolderModal = false;
        this.refreshView();
        this.toastService.show('Folder created', 'success');
      },
      error: () => this.toastService.show('Failed to create folder', 'error')
    });
  }

  async deleteFolder(event: Event, folder: Folder) {
    event.stopPropagation();
    if (await this.confirmService.confirm(`Are you sure you want to delete "${folder.name}" and all its contents?`, 'Delete Folder')) {
      this.resourcesService.removeFolder(folder.id).subscribe({
        next: () => {
          this.allFolders = this.allFolders.filter(f => f.id !== folder.id);
          this.refreshView();
          this.toastService.show('Folder deleted', 'success');
        },
        error: () => this.toastService.show('Failed to delete folder', 'error')
      });
    }
  }

  onFileUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Check limits for free users
    if (!this.isPremium && this.documents.length >= this.MAX_FREE_DOCUMENTS) {
      this.toastService.show(`Limit reached: Free users can only upload up to ${this.MAX_FREE_DOCUMENTS} documents.`, 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name); // Corrected from .originalname
    formData.append('type', this.getFileType(file.name));
    if (this.currentFolder) {
      formData.append('folderId', this.currentFolder.id.toString());
    }

    this.isLoading = true;
    this.resourcesService.create(formData).subscribe({
      next: (newDoc) => {
        // Normalize the new document to ensure folderId is present for filtering
        if (this.currentFolder) {
          newDoc.folderId = this.currentFolder.id;
        } else {
          newDoc.folderId = null;
        }

        this.documents.push(newDoc);
        this.isLoading = false;
        this.toastService.show('File uploaded successfully', 'success');
        this.refreshView();
      },
      error: (err) => {
        this.toastService.show('Upload failed: ' + (err.error?.message || err.message), 'error');
        this.isLoading = false;
      }
    });
  }

  getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext!)) return 'pdf';
    if (['doc', 'docx'].includes(ext!)) return 'doc';
    if (['xls', 'xlsx'].includes(ext!)) return 'excel';
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext!)) return 'image';
    return 'file';
  }

  getFileIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'pdf': return '📄';
      case 'doc': return '📝';
      case 'excel': return '📊';
      case 'image': return '🖼️';
      default: return '📁';
    }
  }

  downloadFile(event: Event, doc: DocumentItem) {
    event.stopPropagation();
    window.open(doc.content, '_blank');
  }

  async deleteFile(event: Event, doc: DocumentItem) {
    event.stopPropagation();
    if (await this.confirmService.confirm(`Are you sure you want to delete "${doc.title}"?`, 'Delete File')) {
      this.resourcesService.delete(doc.id).subscribe({
        next: () => {
          this.documents = this.documents.filter(d => d.id !== doc.id);
          this.toastService.show('File deleted', 'success');
        },
        error: () => this.toastService.show('Failed to delete file', 'error')
      });
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  get docCount(): number {
    return this.documents.length;
  }

  get docsRemaining(): number {
    return Math.max(0, this.MAX_FREE_DOCUMENTS - this.docCount);
  }

  get isLimitReached(): boolean {
    return !this.isPremium && this.docCount >= this.MAX_FREE_DOCUMENTS;
  }

  goToPricing() {
    this.router.navigate(['/pricing']); // Assuming pricing route exists or user wants it
  }
}
