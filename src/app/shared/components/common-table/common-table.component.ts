import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef, ViewChild, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColumnFilter, Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';

export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filter?: boolean;
  filterType?: 'text' | 'numeric' | 'boolean' | 'date';
  filterMatchMode?: string;
  width?: string;
  type?: 'text' | 'link' | 'custom' | 'badge' | 'date';
}

export interface TableAction {
  label?: string;
  icon?: string;
  styleClass?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

@Component({
  selector: 'app-common-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule
  ],
  templateUrl: './common-table.component.html',
  styleUrl: './common-table.component.scss'
})
export class CommonTableComponent implements DoCheck {
  @ViewChild('dt') dt!: Table;
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading: boolean = false;
  @Input() paginator: boolean = true;
  @Input() rows: number = 10;
  @Input() rowsPerPageOptions: number[] = [10, 25, 50];
  @Input() totalRecords: number = 0;
  @Input() first: number = 0;
  @Input() lazy: boolean = true;
  @Input() selectionMode: 'single' | 'multiple' | null = null;
  @Input() dataKey: string = 'id';
  @Input() globalFilterFields: string[] = [];
  @Input() showCurrentPageReport: boolean = true;
  @Input() currentPageReportTemplate: string = 'Showing {first} to {last} of {totalRecords} entries';
  @Input() emptyMessage: string = 'No records found.';
  @Input() showSearch: boolean = true;
  @Input() searchPlaceholder: string = 'Search';
  @Input() actions: TableAction[] = [];
  @Input() searchTerm: string = '';
  
  @Output() pageChange = new EventEmitter<any>();
  @Output() rowSelect = new EventEmitter<any>();
  @Output() rowUnselect = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<any>();
  @Output() filterChange = new EventEmitter<any>();
  @Output() searchTermChange = new EventEmitter<string>();
  
  @ContentChild('bodyTemplate') bodyTemplate!: TemplateRef<any>;
  @ContentChild('headerTemplate') headerTemplate!: TemplateRef<any>;
  @ContentChild('captionTemplate') captionTemplate!: TemplateRef<any>;
  
  selectedItems: any[] = [];
  
  onPageChange(event: any): void {
    this.pageChange.emit(event);
  }
  
  onRowSelect(event: any): void {
    this.rowSelect.emit(event);
  }
  
  onRowUnselect(event: any): void {
    this.rowUnselect.emit(event);
  }
  
  onSelectionChange(value: any[]): void {
    this.selectedItems = value;
    this.selectionChange.emit(value);
  }
  
  onSearch(value: string): void {
    this.searchTerm = value;
    this.searchTermChange.emit(value);
    this.searchChange.emit(value);
  }

  onSort(event: any): void {
    this.sortChange.emit(event);
  }

  onFilter(event: any): void {
    this.filterChange.emit(event);
  }
  
  executeAction(action: TableAction): void {
    if (!action.disabled && !action.loading) {
      action.onClick();
    }
  }

  // Filter helper methods
  ngDoCheck(): void {
    // Placeholder for filter state updates if needed
  }

  isColumnFiltered(field: string): boolean {
    if (!this.dt || !(this.dt as any).filters || !field) return false;
    const filter = (this.dt as any).filters?.[field];
    if (!filter) return false;
    if (Array.isArray(filter)) return filter.some(f => this.hasValue(f?.value));
    return this.hasValue(filter.value);
  }

  private hasValue(v: any): boolean {
    return v !== null && v !== undefined && v !== '';
  }

  getDateFilterValue(field: string): Date | null {
    if (!this.dt || !(this.dt as any).filters || !field) return null;
    const filterArr = (this.dt as any).filters[field];
    const currentValue = Array.isArray(filterArr) && filterArr.length > 0 ? filterArr[0]?.value : null;
    return currentValue ? new Date(currentValue) : null;
  }

  onDateFilterChange(field: string, newDate: Date | null): void {
    if (!this.dt || !(this.dt as any).filters || !field) return;
    const tableFilters: any = (this.dt as any).filters;
    const filterArr = tableFilters[field];
    if (Array.isArray(filterArr) && filterArr.length > 0) {
      filterArr[0].value = newDate ? newDate.toISOString() : null;
    }
  }
}
