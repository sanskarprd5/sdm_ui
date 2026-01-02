import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-upload-dialog',
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './upload-dialog.component.html',
  styleUrl: './upload-dialog.component.scss'
})
export class UploadDialogComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() documentName: string = '';
  @Input() maxFileSize: number = 5; // in MB
  @Input() allowedFileTypes: string[] = ['PDF'];
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() fileSelected = new EventEmitter<File>();
  @Output() cancel = new EventEmitter<void>();

  selectedFile: File | null = null;
  dragOver: boolean = false;
  isUploading: boolean = false;
  private userCancelled: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    // Reset upload state when dialog becomes visible
    if (changes['visible']) {
      if (changes['visible'].currentValue === true) {
        console.log('Dialog opened - resetting ALL state');
        this.resetDialogState();
      }
    }
  }

  private resetDialogState(): void {
    this.isUploading = false;
    this.selectedFile = null;
    this.dragOver = false;
    this.userCancelled = false;
    
    // Clear file input with a slight delay to ensure DOM is ready
    setTimeout(() => {
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }, 100);
  }

  get acceptFileTypes(): string {
    return this.allowedFileTypes.map(type => '.' + type.toLowerCase()).join(',');
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  handleFile(file: File): void {
    console.log('File selected:', file.name, 'Size:', file.size);
    
    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toUpperCase();
    const allowedTypesUpper = this.allowedFileTypes.map(t => t.toUpperCase());
    
    console.log('File extension:', fileExtension, 'Allowed:', allowedTypesUpper);
    
    if (!fileExtension || !allowedTypesUpper.includes(fileExtension)) {
      alert(`Only ${this.allowedFileTypes.join(', ')} files are allowed`);
      return;
    }

    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    console.log('File size in MB:', fileSizeInMB, 'Max allowed:', this.maxFileSize);
    
    if (fileSizeInMB > this.maxFileSize) {
      alert(`File size must not exceed ${this.maxFileSize} MB`);
      return;
    }

    this.selectedFile = file;
    console.log('File set successfully:', this.selectedFile);
  }

  onUpload(): void {
    console.log('Upload button clicked');
    console.log('Selected file:', this.selectedFile);
    console.log('Is uploading:', this.isUploading);
    
    if (this.selectedFile && !this.isUploading) {
      this.isUploading = true;
      console.log('Emitting file selected event');
      this.fileSelected.emit(this.selectedFile);
      // Don't close dialog immediately - let parent component handle it
    } else if (!this.selectedFile) {
      console.warn('No file selected');
      alert('Please select a file first');
    } else if (this.isUploading) {
      console.warn('Upload already in progress');
    }
  }

  onCancel(): void {
    console.log('Cancel button explicitly clicked by user');
    this.userCancelled = true;
    this.closeDialog();
  }

  closeDialog(): void {
    console.log('closeDialog called - userCancelled:', this.userCancelled);
    
    if (this.userCancelled) {
      console.log('Emitting cancel event');
      this.cancel.emit();
    }
    
    this.resetDialogState();
    this.visible = false;
    this.visibleChange.emit(false);
  }

  removeFile(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }
}
