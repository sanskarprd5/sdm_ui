import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';

export interface AlertConfig {
  email?: string;
  notification?: boolean;
  emailChecked?: boolean;
  shipmentNos?: string[];
  alertName?: string;
  thresholdDays?: number;
  hazardousGoods?: boolean;
  trigger?: string;
  companyName?: string;
  carrier?: string;
  portOfDeparture?: string;
  portOfArrival?: string;
  startDate?: Date;
  endDate?: Date;
}

@Component({
  selector: 'app-alert-config-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    CheckboxModule,
    CalendarModule,
    RadioButtonModule,
    ButtonModule,
    MultiSelectModule
  ],
  templateUrl: './alert-config-dialog.component.html',
  styleUrl: './alert-config-dialog.component.scss'
})
export class AlertConfigDialogComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() selectedShipments: any[] = [];
  @Input() initialConfig: Partial<AlertConfig> | null = null;
  @Input() autoSelectShipments: boolean = true;
  @Input() useTextFieldForShipments: boolean = false; // New input to control display mode
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<AlertConfig>();
  @Output() cancel = new EventEmitter<void>();

  // Form fields
  emailChecked: boolean = true;
  notificationChecked: boolean = false;
  email: string = '';
  shipmentNos: any[] = [];
  shipmentNosText: string = ''; // Text field value for arrival page
  alertName: string = '';
  thresholdDays!: number;
  hazardousGoods: string = 'yes';
  trigger: string = 'Realtime';
  companyName: string = '';
  carrier: string = '';
  portOfDeparture: string = '';
  portOfArrival: string = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Dropdown options
  triggerOptions = [
    { label: 'Realtime', value: 'Realtime' },
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' }
  ];

  companyOptions = [
    { label: 'Company 1', value: 'Company 1' },
    { label: 'Company 2', value: 'Company 2' },
    { label: 'Company 3', value: 'Company 3' }
  ];

  carrierOptions = [
    { label: 'Carrier 1', value: 'Carrier 1' },
    { label: 'Carrier 2', value: 'Carrier 2' },
    { label: 'Carrier 3', value: 'Carrier 3' }
  ];

  portDepartureOptions = [
    { label: 'Mumbai, India', value: 'Mumbai, India' },
    { label: 'Shanghai, China', value: 'Shanghai, China' },
    { label: 'Singapore', value: 'Singapore' }
  ];

  portArrivalOptions = [
    { label: 'Houston, USA', value: 'Houston, USA' },
    { label: 'Los Angeles, USA', value: 'Los Angeles, USA' },
    { label: 'New York, USA', value: 'New York, USA' }
  ];

  shipmentOptions: any[] = [];
  private pendingShipmentSelections: string[] | null = null;

  // Static shipment numbers for the dropdown
  private staticShipmentNumbers = [
    '996314', 'KBUSI0095525', 'KBUSI0095499', 'THSI0091337', 'INBSI0093197',
    'INBSI0093976', 'SCMXIS2111005', '1276750832', '1196755590', 'HKSI0201052',
    'THSI0091713', 'PENSI0017347', 'PENSI0017295', 'PENSI0017349', '1276762128',
    '23113744', 'THSI0091747', 'PENSI0017338', 'THSI0091734', 'THSI0091798',
    '1245719991', '1276764192', '1276764268', 'JPSI0092439', '1475204559',
    'THSI0091870', 'PENSI0017362', 'PENSI0017391', 'INBSI0094595', 'PENSI0017405',
    'PENSI0017396', 'PENSI0017402', '1475205734', '1475205735', 'HANSI0001710',
    'THSI0091952', 'CSZSI0034654', 'INBSI0094846', 'PENSI0017442', 'THSI0091961',
    'JPSI0092564', 'JPSI0092566', 'JPSI0092568', '1276768678', 'PENSI0017445',
    'THSI0092028', 'THSI0092025', '1276771405', '1276771798', 'ICHSI0016123',
    'KBUSI0096604', 'KBUSI0096602', 'INBSI0095210', '1276772585', 'KBUSI0096619',
    'PENSI0017532', 'PENSI0017533', 'PENSI0017534', 'KBUSI0096653', '1276774033',
    'THSI0092221', '23114701', '1196775661', '1196775614', '1196775772',
    '1276775638', 'JPSI0092830', 'IMCSR202110520BR', 'IMCSR202111131BR', 'NZSI0031265',
    'IMCSR202110100BR', 'IMCSR202108388BR', 'IMCSR202111399BR', 'NZSI0031266', 'NZSI0031267',
    'IMCSR202103041BR', 'IMCSR202109224BR', 'NZSI0031225', 'IMCSR202111066BR', 'IMCSR202111014BR',
    'AUSI0156489', 'IMCSR202106818BR', 'IMCSR202110221BR', 'IMCSR202111351BR', 'IMCSR202109225BR',
    'IMCSR202109354BR', 'PENSI0017569', 'PENSI0017568', 'PENSI0017570', 'THSI0092321',
    'IMCSR202112037BR', 'IMCSR202112036BR', 'IMCSR202112053BR', 'IMCSR202112038BR', 'IMCSR202112039BR',
    'IMCSR202112035BR', 'IMCSR202112040BR', 'IMCSR202112034BR', 'PENSI0017596', 'AUSI0157018',
    'AUSI0156981', '1146779079', 'AUSI0156980', '83114488', '83114638', '83114635'
  ];

  ngOnInit(): void {
    this.resetForm();
    this.initializeStaticShipmentOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedShipments']) {
      this.updateShipmentOptions();
      
      // If using text field mode and selectedShipments changed, update text field
      if (this.useTextFieldForShipments && this.selectedShipments?.length > 0) {
        const shipmentNumbers = this.selectedShipments
          .map(s => s.shipmentNo)
          .filter(Boolean);
        this.shipmentNosText = shipmentNumbers.join(', ');
      }
    }

    if (changes['initialConfig']) {
      if (this.initialConfig) {
        this.applyInitialConfig(this.initialConfig);
      } else {
        this.resetForm();
        if (this.shipmentOptions.length) {
          this.shipmentNos = [];
        }
      }
    }
  }

  private updateShipmentOptions(): void {
    // Start with static shipment numbers
    const allShipments = new Map<string, any>();
    
    // Add static shipment numbers first
    this.staticShipmentNumbers.forEach(shipmentNo => {
      allShipments.set(shipmentNo, { label: shipmentNo, value: shipmentNo });
    });
    
    // Add dynamic shipments from selectedShipments (if any)
    (this.selectedShipments || []).forEach(shipment => {
      if (shipment?.shipmentNo && !allShipments.has(shipment.shipmentNo)) {
        allShipments.set(shipment.shipmentNo, {
          label: shipment.shipmentNo,
          value: shipment.shipmentNo
        });
      }
    });

    // Convert to array
    this.shipmentOptions = Array.from(allShipments.values());

    if (this.pendingShipmentSelections && this.pendingShipmentSelections.length > 0) {
      this.setShipmentSelections(this.pendingShipmentSelections);
      this.pendingShipmentSelections = null;
      return;
    }

    if (
      this.autoSelectShipments &&
      !this.initialConfig?.shipmentNos?.length &&
      this.shipmentNos.length === 0
    ) {
      this.shipmentNos = [...this.shipmentOptions];
    }
  }

  private initializeStaticShipmentOptions(): void {
    // Initialize shipment options with static values on component init
    this.shipmentOptions = this.staticShipmentNumbers.map(shipmentNo => ({
      label: shipmentNo,
      value: shipmentNo
    }));
  }

  private resetForm(): void {
    this.emailChecked = false;
    this.notificationChecked = false;
    this.email = '';
    this.alertName = '';
    this.thresholdDays = 0;
    this.hazardousGoods = 'yes';
    this.trigger = 'Realtime';
    this.companyName = '';
    this.carrier = '';
    this.portOfDeparture = '';
    this.portOfArrival = '';
    this.shipmentNos = [];
    this.pendingShipmentSelections = null;
    
    this.startDate = new Date();
    this.endDate = new Date('2025-05-02');
  }

  private applyInitialConfig(config: Partial<AlertConfig>): void {
    this.resetForm();

    this.emailChecked = !!config.emailChecked;
    this.notificationChecked = !!config.notification;
    this.email = config.email ?? '';
    this.alertName = config.alertName ?? '';
    if (typeof config.thresholdDays === 'number') {
      this.thresholdDays = config.thresholdDays;
    }
    if (typeof config.hazardousGoods === 'boolean') {
      this.hazardousGoods = config.hazardousGoods ? 'yes' : 'no';
    }
    if (config.trigger) {
      this.trigger = config.trigger;
    }
    this.companyName = config.companyName ?? '';
    this.carrier = config.carrier ?? '';
    this.portOfDeparture = config.portOfDeparture ?? '';
    this.portOfArrival = config.portOfArrival ?? '';
    this.startDate = config.startDate ?? this.startDate;
    this.endDate = config.endDate ?? this.endDate;

    if (config.shipmentNos && config.shipmentNos.length > 0) {
      if (this.shipmentOptions.length === 0) {
        this.pendingShipmentSelections = [...config.shipmentNos];
      } else {
        this.setShipmentSelections(config.shipmentNos);
      }
    }
  }

  private setShipmentSelections(values: string[]): void {
    const selectedValues = new Set(values);
    this.shipmentNos = this.shipmentOptions.filter(option => selectedValues.has(option.value));
  }

  onHide(): void {
    this.visibleChange.emit(false);
  }

  onCancel(): void {
    this.cancel.emit();
    this.onHide();
  }

  onSave(): void {
    // Get shipment numbers based on mode
    let shipmentNumbers: string[] = [];
    
    if (this.useTextFieldForShipments) {
      // Parse comma-separated text field
      shipmentNumbers = this.shipmentNosText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    } else {
      // Get from multi-select dropdown
      shipmentNumbers = this.shipmentNos.map(s => s.value);
    }

    const config: AlertConfig = {
      emailChecked: this.emailChecked,
      notification: this.notificationChecked,
      email: this.email,
      shipmentNos: shipmentNumbers,
      alertName: this.alertName,
      thresholdDays: this.thresholdDays,
      hazardousGoods: this.hazardousGoods === 'yes',
      trigger: this.trigger,
      companyName: this.companyName,
      carrier: this.carrier,
      portOfDeparture: this.portOfDeparture,
      portOfArrival: this.portOfArrival,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined
    };

    this.save.emit(config);
    this.onHide();
  }
}
