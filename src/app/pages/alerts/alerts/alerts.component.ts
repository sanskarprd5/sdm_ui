import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AlertConfig, AlertConfigDialogComponent } from '../../../shared/components/alert-config-dialog/alert-config-dialog.component';
import { MainPanelComponent } from '../../../shared/components/main-panel/main-panel.component';
import { AlertsService, AlertDto, CreateAlertRequest } from './alerts.service';

interface ShipmentAlertRow {
  id: number;
  shipmentNo: string;
  shipmentsList: string[];
  status: 'Early' | 'Late';
  alertName: string;
  email: 'Yes' | 'No';
  emailRecipients: string[];
  notification: 'Yes' | 'No';
  thresholdDays: number;
  hazardousGoods: 'Yes' | 'No';
  trigger: string;
  company: string;
  carrier: string;
  portOfDeparture: string;
  portOfArrival: string;
  startDate: string;
  endDate: string;
}

interface EtaAlertRow {
  trigger: string;
  company: string;
  carrier: string;
  portOfDeparture: string;
  portOfArrival: string;
  startDate: string;
  endDate: string;
}

interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'status' | 'boolean' | 'action';
}

interface AlertTab {
  id: 'shipments' | 'eta';
  label: string;
}

@Component({
  selector: 'app-alerts',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    AlertConfigDialogComponent,
    MainPanelComponent
  ],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss'
})
export class AlertsComponent implements OnInit {
  tabs: AlertTab[] = [
    { id: 'shipments', label: 'Shipments Early/ Late' },
    { id: 'eta', label: 'Change of ETA' }
  ];
  activeTabId: AlertTab['id'] = 'shipments';

  searchTerm: string = '';
  shipmentsData: ShipmentAlertRow[] = [];
  etaData: EtaAlertRow[] = [];
  filteredShipments: ShipmentAlertRow[] = [];
  filteredEta: EtaAlertRow[] = [];
  dialogInitialConfig: Partial<AlertConfig> | null = null;
  dialogShipmentsSource: ShipmentAlertRow[] = [];
  dialogAutoSelectShipments = false;

  shipmentsColumns: TableColumn[] = [
    { field: 'action', header: 'Action', type: 'action' },
    { field: 'shipmentNo', header: 'Shipment No.', sortable: true, filterable: true },
    { field: 'status', header: 'Status', sortable: true, filterable: true, type: 'status' },
    { field: 'alertName', header: 'Alert Name', sortable: true, filterable: true },
    { field: 'email', header: 'Email', sortable: true, filterable: true, type: 'boolean' },
    { field: 'notification', header: 'Notification', sortable: true, filterable: true, type: 'boolean' },
    { field: 'thresholdDays', header: 'Threshold Days', sortable: true, filterable: true },
    { field: 'hazardousGoods', header: 'Hazardous Goods', sortable: true, filterable: true, type: 'boolean' },
    { field: 'trigger', header: 'Trigger', sortable: true, filterable: true },
    { field: 'company', header: 'Company', sortable: true, filterable: true },
    { field: 'carrier', header: 'Carrier', sortable: true, filterable: true },
    { field: 'portOfDeparture', header: 'Port Od Departure', sortable: true, filterable: true },
    { field: 'portOfArrival', header: 'Port of Arrival', sortable: true, filterable: true },
    { field: 'startDate', header: 'Start Date', sortable: true, filterable: true },
    { field: 'endDate', header: 'End Date', sortable: true, filterable: true }
  ];

  etaColumns: TableColumn[] = [
    { field: 'trigger', header: 'Trigger', sortable: true, filterable: true },
    { field: 'company', header: 'Company', sortable: true, filterable: true },
    { field: 'carrier', header: 'Carrier', sortable: true, filterable: true },
    { field: 'portOfDeparture', header: 'Port Od Departure', sortable: true, filterable: true },
    { field: 'portOfArrival', header: 'Port of Arrival', sortable: true, filterable: true },
    { field: 'startDate', header: 'Start Date', sortable: true, filterable: true },
    { field: 'endDate', header: 'End Date', sortable: true, filterable: true }
  ];

  showAlertConfigDialog = false;
  isLoading = false;
  loadError: string | null = null;
  editingAlertId: number | null = null; // Track which alert is being edited

  constructor(private alertsService: AlertsService) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  get tableColumns(): TableColumn[] {
    return this.activeTabId === 'shipments' ? this.shipmentsColumns : this.etaColumns;
  }

  get tableData(): Array<ShipmentAlertRow | EtaAlertRow> {
    return this.activeTabId === 'shipments' ? this.filteredShipments : this.filteredEta;
  }

  loadAlerts(): void {
    this.isLoading = true;
    this.loadError = null;

    this.alertsService.getAlerts().subscribe({
      next: (alerts) => {
        this.shipmentsData = alerts.map(alert => this.mapAlertToRow(alert));
        this.dialogShipmentsSource = [...this.shipmentsData];
        this.applySearch();
      },
      error: (error) => {
        console.error('Failed to load alerts:', error);
        this.shipmentsData = [];
        this.filteredShipments = [];
        this.dialogShipmentsSource = [];
        this.loadError = 'Unable to load alerts. Please try again.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private mapAlertToRow(alert: AlertDto): ShipmentAlertRow {
    const shipmentsList = alert.shipments ?? [];
    const status = this.deriveStatus(alert.alertType);

    return {
      id: alert.id,
      shipmentNo: shipmentsList.length ? shipmentsList.join(', ') : '--',
      shipmentsList,
      status,
      alertName: alert.name || '--',
      email: alert.emailTo?.length ? 'Yes' : 'No',
      emailRecipients: alert.emailTo ?? [],
      notification: alert.enabled ? 'Yes' : 'No',
      thresholdDays: alert.thresholdDays ?? 0,
      hazardousGoods: alert.hazardousGoods ? 'Yes' : 'No',
      trigger: alert.triggerType || '--',
      company: alert.companyName || '--',
      carrier: alert.carrier || '--',
      portOfDeparture: alert.portOfDeparture || '--',
      portOfArrival: alert.portOfArrival || '--',
      startDate: this.formatDate(alert.startDate),
      endDate: this.formatDate(alert.endDate)
    };
  }

  private deriveStatus(alertType?: number): 'Early' | 'Late' {
    if (alertType === 1) {
      return 'Early';
    }
    return 'Late';
  }

  private formatDate(value?: string | null): string {
    if (!value) {
      return '--';
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  setActiveTab(tabId: AlertTab['id']): void {
    if (this.activeTabId !== tabId) {
      this.activeTabId = tabId;
      this.searchTerm = '';
      this.applySearch();
    }
  }

  onSearch(): void {
    this.applySearch();
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredShipments = [...this.shipmentsData];
      this.filteredEta = [...this.etaData];
      return;
    }

    const matchesTerm = (value: unknown): boolean => {
      if (Array.isArray(value)) {
        return value.some(item => matchesTerm(item));
      }

      if (value === null || value === undefined) {
        return false;
      }

      return value.toString().toLowerCase().includes(term);
    };

    this.filteredShipments = this.shipmentsData.filter(row =>
      Object.values(row).some(val => matchesTerm(val))
    );

    this.filteredEta = this.etaData.filter(row =>
      Object.values(row).some(val => matchesTerm(val))
    );
  }

  refresh(): void {
    this.searchTerm = '';
    this.loadAlerts();
  }

  addAlert(): void {
    this.editingAlertId = null; // Clear editing mode
    this.dialogInitialConfig = null;
    this.dialogAutoSelectShipments = false;
    this.dialogShipmentsSource = [...this.shipmentsData];
    this.showAlertConfigDialog = true;
  }

  onEditRow(row: ShipmentAlertRow | EtaAlertRow): void {
    if (!('shipmentNo' in row)) {
      return;
    }

    const shipmentRow = row as ShipmentAlertRow;
    this.editingAlertId = shipmentRow.id; // Set the alert ID being edited
    this.dialogInitialConfig = {
      alertName: shipmentRow.alertName,
      email: shipmentRow.emailRecipients[0] ?? '',
      emailChecked: shipmentRow.email === 'Yes',
      notification: shipmentRow.notification === 'Yes',
      shipmentNos: shipmentRow.shipmentsList?.length ? shipmentRow.shipmentsList : [shipmentRow.shipmentNo],
      thresholdDays: shipmentRow.thresholdDays,
      hazardousGoods: shipmentRow.hazardousGoods === 'Yes',
      trigger: shipmentRow.trigger,
      companyName: shipmentRow.company,
      carrier: shipmentRow.carrier,
      portOfDeparture: shipmentRow.portOfDeparture,
      portOfArrival: shipmentRow.portOfArrival,
      startDate: this.toDate(shipmentRow.startDate),
      endDate: this.toDate(shipmentRow.endDate)
    };

    this.dialogShipmentsSource = [...this.shipmentsData];
    this.dialogAutoSelectShipments = false;
    this.showAlertConfigDialog = true;
  }

  onAlertConfigSave(config: AlertConfig): void {
    console.log('Alert config saved from alerts page:', config);
    
    // Build the API request payload
    const emailRecipients = config.email ? [config.email] : [];
    const shipmentNumbers = config.shipmentNos || [];
    
    const alertRequest = {
      name: config.alertName || 'Shipment Delay Alert',
      module: 'ARRIVAL',
      alertType: 2,
      triggerType: 'Realtime',
      thresholdDays: config.thresholdDays || 0,
      startDate: this.formatDateForApi(config.startDate),
      endDate: this.formatDateForApi(config.endDate),
      emailTo: emailRecipients,
      shipments: shipmentNumbers,
      enabled: true,
      emailEnabled: config.emailChecked || false,
      notificationEnabled: config.notification || false,
      companyName: config.companyName || '',
      portOfDeparture: config.portOfDeparture || '',
      portOfArrival: config.portOfArrival || '',
      carrier: config.carrier || '',
      hazardousGoods: config.hazardousGoods || false
    };

    // Call update or create API based on editing mode
    const apiCall = this.editingAlertId !== null
      ? this.alertsService.updateAlert(this.editingAlertId, alertRequest)
      : this.alertsService.createAlert(alertRequest);

    const action = this.editingAlertId !== null ? 'updated' : 'created';
    console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} alert with payload:`, alertRequest);

    apiCall.subscribe({
      next: (response) => {
        console.log(`Alert ${action} successfully:`, response);
        this.showAlertConfigDialog = false;
        this.dialogInitialConfig = null;
        this.editingAlertId = null;
        // Reload alerts to show the changes
        this.loadAlerts();
      },
      error: (error) => {
        console.error(`Failed to ${action.slice(0, -1)} alert:`, error);
        // Keep dialog open on error so user can retry
        alert(`Failed to ${action.slice(0, -1)} alert. Please try again.`);
      }
    });
  }

  private formatDateForApi(date: Date | undefined | null): string {
    if (!date) {
      return new Date().toISOString().split('T')[0];
    }
    
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    
    return d.toISOString().split('T')[0];
  }

  onAlertConfigCancel(): void {
    this.showAlertConfigDialog = false;
    this.dialogInitialConfig = null;
    this.editingAlertId = null; // Clear editing state
  }

  getStatusClass(status?: string): 'status-early' | 'status-late' {
    return status === 'Late' ? 'status-late' : 'status-early';
  }

  private toDate(value: string): Date | undefined {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
}
