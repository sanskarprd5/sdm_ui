import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent implements OnChanges {
  @Input() message: string = '';
  @Input() type: ToastType = 'success';
  @Input() show: boolean = false;
  @Input() duration: number = 3000; // Auto-dismiss duration in milliseconds
  @Output() dismissed = new EventEmitter<void>();

  private timeoutId: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show'] && this.show) {
      this.startAutoClose();
    }
  }

  private startAutoClose(): void {
    // Clear any existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Set new timeout for auto-dismiss
    this.timeoutId = setTimeout(() => {
      this.close();
    }, this.duration);
  }

  close(): void {
    this.dismissed.emit();
  }

  getIcon(): string {
    switch (this.type) {
      case 'success':
        return 'pi pi-check-circle';
      case 'error':
        return 'pi pi-times-circle';
      case 'info':
        return 'pi pi-info-circle';
      case 'warning':
        return 'pi pi-exclamation-triangle';
      default:
        return 'pi pi-info-circle';
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
