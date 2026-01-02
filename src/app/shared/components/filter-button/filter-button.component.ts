import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-filter-button',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule
  ],
  templateUrl: './filter-button.component.html',
  styleUrl: './filter-button.component.scss'
})
export class FilterButtonComponent {
  @Input() label: string = 'Show Filters';
  @Input() icon: string = 'pi pi-filter';
  @Input() showFilters: boolean = false;
  @Output() showFiltersChange = new EventEmitter<boolean>();
  @Output() onToggle = new EventEmitter<boolean>();

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    this.showFiltersChange.emit(this.showFilters);
    this.onToggle.emit(this.showFilters);
  }
}
