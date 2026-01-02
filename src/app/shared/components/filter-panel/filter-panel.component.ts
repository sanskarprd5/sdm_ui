import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    FormsModule
  ],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.scss'
})
export class FilterPanelComponent {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onApply = new EventEmitter<any>();
  @Output() onClear = new EventEmitter<void>();

  // Filter form data
  savedFilterSearch: string = '';
  selectedCompany: any = null;
  selectedOriginPort: any = null;
  selectedDestinationPort: any = null;
  selectedCarrier: any = null;

  // Dropdown options
  companyOptions = [
    { label: 'Company A', value: 'company_a' },
    { label: 'Company B', value: 'company_b' },
    { label: 'Company C', value: 'company_c' }
  ];

  originPortOptions = [
    { label: 'Port A', value: 'port_a' },
    { label: 'Port B', value: 'port_b' },
    { label: 'Port C', value: 'port_c' }
  ];

  destinationPortOptions = [
    { label: 'Port X', value: 'port_x' },
    { label: 'Port Y', value: 'port_y' },
    { label: 'Port Z', value: 'port_z' }
  ];

  carrierOptions = [
    { label: 'Carrier 1', value: 'carrier_1' },
    { label: 'Carrier 2', value: 'carrier_2' },
    { label: 'Carrier 3', value: 'carrier_3' }
  ];

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  clearFilters(): void {
    this.selectedCompany = null;
    this.selectedOriginPort = null;
    this.selectedDestinationPort = null;
    this.selectedCarrier = null;
    this.savedFilterSearch = '';
    this.onClear.emit();
  }

  applyFilters(): void {
    const filters = {
      company: this.selectedCompany,
      originPort: this.selectedOriginPort,
      destinationPort: this.selectedDestinationPort,
      carrier: this.selectedCarrier
    };
    this.onApply.emit(filters);
    this.close();
  }

  saveFilterCriteria(): void {
    console.log('Save filter criteria');
  }

  openSettings(): void {
    console.log('Open filter settings');
  }
}
