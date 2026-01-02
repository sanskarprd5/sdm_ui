import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MainPanelComponent } from '../../../shared/components/main-panel/main-panel.component';
import { KpiWidgetsComponent } from '../../../shared/components/kpi-widgets/kpi-widgets.component';
import { CommonTableComponent, TableAction } from '../../../shared/components/common-table/common-table.component';
import { UploadDialogComponent } from '../../../shared/components/upload-dialog/upload-dialog.component';
import { ToastComponent, ToastType } from '../../../shared/components/toast/toast.component';
import { AlertConfigDialogComponent } from '../../../shared/components/alert-config-dialog/alert-config-dialog.component';
import { FilterButtonComponent } from '../../../shared/components/filter-button/filter-button.component';
import { FilterPanelComponent } from '../../../shared/components/filter-panel/filter-panel.component';
import { 
  Shipment, 
  KpiCard, 
  TableColumn, 
  ARRIVAL_KPI_CONFIG, 
  getColumnsForKpi,
  mapStatusCountsToKpis
} from '../arrival.model';
import { ArrivalService, GlobalFilter, TableDataRequest, ColumnFilter, OrderConfig } from '../arrival.service';
import { AlertsService, CreateAlertRequest } from '../../alerts/alerts/alerts.service';

@Component({
  selector: 'app-arrival',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    DialogModule,
    MainPanelComponent,
    KpiWidgetsComponent,
    CommonTableComponent,
    UploadDialogComponent,
    ToastComponent,
    AlertConfigDialogComponent,
    FilterButtonComponent,
    FilterPanelComponent
  ],
  templateUrl: './arrival.component.html',
  styleUrl: './arrival.component.scss'
})
export class ArrivalComponent implements OnInit {
  shipments: Shipment[] = [];
  selectedShipments: Shipment[] = [];
  searchTerm: string = '';
  pageSize: number = 10;
  totalRecords: number = 0;
  first: number = 0;
  currentPage: number = 0;
  isTableLoading: boolean = false;

  // Filter visibility
  showFilters: boolean = false;
  appliedFilters: GlobalFilter[] = [];

  // Search and filter state
  currentKeyFilter: string = '';
  currentOrder: OrderConfig = { column: 'bdpReferenceNo', dir: 'asc' };
  currentColumnFilters: ColumnFilter[] = [];

  // KPI Configuration from model
  kpiCards: KpiCard[] = ARRIVAL_KPI_CONFIG;
  activeKpiId: string = ARRIVAL_KPI_CONFIG[0].id;

  // Dynamic table headers based on active KPI
  tableHeaders: TableColumn[] = [];
  
  // Table actions for common-table component
  tableActions: TableAction[] = [];
  
  // Column settings dialog visibility
  showColumnSettings: boolean = false;
  
  // Missing documents dialog
  showMissingDocsDialog: boolean = false;
  selectedShipmentForDocs: any = null;

  // Upload dialog
  showUploadDialog: boolean = false;
  currentDocumentForUpload: any = null;

  // Alert config dialog
  showAlertConfigDialog: boolean = false;

  // Toast message
  toastMessage: string = '';
  showToast: boolean = false;
  toastType: ToastType = 'success';
  
  // Email sending state
  isEmailSending: boolean = false;
  
  // Global filter fields for table search
  globalFilterFields: string[] = [
    'shipmentNo', 'poNo', 'customerName', 'sourceSystem', 'bdpRepresentativeName', 
    'modeOfTransport', 'moveTypeDescription', 'carrierName', 'hbl', 'portOfDeparture', 
    'portOfTransit', 'portOfArrival', 'placeOfDeliveryUnloc', 'documentDistributionReceived', 
    'atd', 'eta', 'predictiveETA', 'latestEta', 'ata', 'carrierReleaseRequest', 
    'releaseReceivedFromCarrier'
  ];

  private readonly kpiStatusMap: Record<string, number> = {
    'shipments-arriving': 101,
    'incomplete-documents': 102,
    'shipments-late': 103,
    'shipments-early': 104,
    'shipments-arrived': 105
  };

  constructor(
    private arrivalService: ArrivalService,
    private alertsService: AlertsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadKpiCounts();
    this.updateTableColumns();
    this.initializeTableActions();
    this.loadShipments();
  }

  /**
   * Load KPI counts from API
   */
  loadKpiCounts(globalFilter?: GlobalFilter[]): void {
    this.arrivalService.getArrivalStatusCounts(globalFilter).subscribe({
      next: (statusCounts) => {
        this.kpiCards = mapStatusCountsToKpis(statusCounts);
        console.log('KPI counts loaded:', this.kpiCards);
      },
      error: (error) => {
        console.error('Error loading KPI counts:', error);
        // Keep default/mock KPI counts
      }
    });
  }

  /**
   * Update table columns based on active KPI
   */
  updateTableColumns(): void {
    this.tableHeaders = getColumnsForKpi(this.activeKpiId);
    console.log('Table headers updated:', this.tableHeaders.length, 'columns');
  }

  /**
   * Initialize table action buttons
   */
  initializeTableActions(): void {
    this.tableActions = [
      {
        icon: 'pi pi-angle-down',
        label: 'Column Settings',
        styleClass: 'p-button-outlined',
        onClick: () => this.toggleColumnSettings()
      },
      {
        icon: 'pi pi-download',
        styleClass: 'p-button-outlined p-button-secondary',
        onClick: () => this.exportData()
      },
      {
        label: this.isEmailSending ? 'Sending...' : 'Add Alert',
        styleClass: 'p-button-primary',
        disabled: this.selectedShipments.length === 0 || this.isEmailSending,
        loading: this.isEmailSending,
        onClick: () => this.addAlert()
      }
    ];
  }

  /**
   * Handle KPI card selection
   * @param kpiId - The ID of the selected KPI
   */
  onKpiSelected(kpiId: string): void {
    this.activeKpiId = kpiId;
    this.updateTableColumns();
    this.first = 0;
    this.currentPage = 0;
    this.loadShipments();
  }

  /**
   * Load shipments from API with current filters
   */
  loadShipments(page: number = this.currentPage): void {
    this.isTableLoading = true;
    const cardId = this.kpiStatusMap[this.activeKpiId] || 101;
    
    const request: TableDataRequest = {
      cardId,
      pageNo: page + 1, // API uses 1-based pagination
      pageSize: this.pageSize,
      keyFilter: this.currentKeyFilter || undefined,
      order: this.currentOrder,
      globalFilter: this.appliedFilters.length > 0 ? this.appliedFilters : undefined,
      columnFilter: this.currentColumnFilters.length > 0 ? this.currentColumnFilters : undefined
    };

    console.log('Loading shipments with request:', request);

    this.arrivalService.searchTableViewData(request).subscribe({
      next: (result) => {
        this.shipments = result.shipments;
        this.totalRecords = result.totalRecords;
        this.currentPage = result.pageNumber;
        this.isTableLoading = false;
        console.log(`Loaded ${result.shipments.length} shipments, total: ${result.totalRecords}`);
      },
      error: (error) => {
        console.error('Error loading shipments:', error);
        this.shipments = [];
        this.totalRecords = 0;
        this.isTableLoading = false;
      }
    });
  }

  onPageChange(event: any): void {
    const rows = event.rows ?? this.pageSize;
    const first = event.first ?? 0;
    const page = Math.floor(first / rows);

    this.pageSize = rows;
    this.first = first;
    this.loadShipments(page);
  }

  /**
   * Handle search input with minimum 3 characters
   * Search is triggered on Enter key press
   */
  onSearch(): void {
    const searchValue = this.searchTerm?.trim() || '';
    
    // Only search if 3+ characters or empty (to clear)
    if (searchValue.length >= 3 || searchValue.length === 0) {
      this.currentKeyFilter = searchValue;
      this.first = 0;
      this.currentPage = 0;
      this.loadShipments();
    } else if (searchValue.length > 0) {
      console.log('Enter at least 3 characters to search');
    }
  }

  /**
   * Handle table sort event
   */
  onSort(event: any): void {
    if (event.field) {
      this.currentOrder = {
        column: event.field,
        dir: event.order === 1 ? 'asc' : 'desc'
      };
      this.first = 0;
      this.currentPage = 0;
      this.loadShipments();
    }
  }

  /**
   * Handle column filter event
   */
  onFilter(event: any): void {
    const filters = event.filters || {};
    const columnFilters: ColumnFilter[] = [];

    // Convert PrimeNG filter format to API format
    for (const [columnName, filterData] of Object.entries(filters)) {
      const filterArray = filterData as any[];
      if (filterArray && filterArray.length > 0) {
        const filter = filterArray[0];
        if (filter.value) {
          columnFilters.push({
            columnName,
            columnValue: filter.value,
            filterOperator: this.mapFilterMatchMode(filter.matchMode || 'startsWith')
          });
        }
      }
    }

    this.currentColumnFilters = columnFilters;
    this.first = 0;
    this.currentPage = 0;
    this.loadShipments();
  }

  /**
   * Map PrimeNG matchMode to API filterOperator
   */
  private mapFilterMatchMode(matchMode: string): string {
    const modeMap: Record<string, string> = {
      'startsWith': 'Starts with',
      'contains': 'Contains',
      'equals': 'Equals',
      'notEquals': 'Not equals',
      'endsWith': 'Ends with'
    };
    return modeMap[matchMode] || 'Starts with';
  }

  refresh(): void {
    this.searchTerm = '';
    this.first = 0;
    this.currentPage = 0;
    this.loadShipments();
    console.log('Data refreshed');
  }

  onSelectionChange(selection: any[]): void {
    this.selectedShipments = selection;
    console.log('Selection changed:', selection);
    // Reinitialize table actions to update disabled state
    this.initializeTableActions();
  }

  /**
   * Toggle filter visibility
   */
  onFilterToggle(show: boolean): void {
    this.showFilters = show;
    console.log('Filters toggled:', this.showFilters);
  }

  /**
   * Apply filters from filter panel
   */
  applyFilters(filters: any): void {
    console.log('Applying filters:', filters);
    
    // Build globalFilter array from filter selections
    const globalFilter: GlobalFilter[] = [];
    
    if (filters.company) {
      globalFilter.push({
        fieldName: 'companyIds',
        fieldValue: filters.company.value || filters.company
      });
    }
    
    if (filters.originPort) {
      globalFilter.push({
        fieldName: 'departurePortIds',
        fieldValue: filters.originPort.value || filters.originPort
      });
    }
    
    if (filters.destinationPort) {
      globalFilter.push({
        fieldName: 'arrivalPortIds',
        fieldValue: filters.destinationPort.value || filters.destinationPort
      });
    }
    
    if (filters.carrier) {
      globalFilter.push({
        fieldName: 'carrierIds',
        fieldValue: filters.carrier.value || filters.carrier
      });
    }
    
    // Store applied filters
    this.appliedFilters = globalFilter;
    
    // Reload KPI counts with filters
    this.loadKpiCounts(globalFilter);
    
    // Reload shipments table with filters
    this.first = 0;
    this.currentPage = 0;
    this.loadShipments();
    console.log('Global filter applied:', globalFilter);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    console.log('Clearing filters');
    this.appliedFilters = [];
    this.loadKpiCounts();
    // Reload shipments table without filters
    this.first = 0;
    this.currentPage = 0;
    this.loadShipments();
  }

  /**
   * Toggle column settings dialog
   */
  toggleColumnSettings(): void {
    this.showColumnSettings = !this.showColumnSettings;
    console.log('Column settings toggled:', this.showColumnSettings);
  }

  /**
   * Export shipments data
   */
  exportData(): void {
    console.log('Export data clicked');
    
    // Export selected or all shipments
    const dataToExport = this.selectedShipments.length > 0 
      ? this.selectedShipments 
      : this.shipments;
    
    // TODO: Implement actual export logic (CSV, Excel, etc.)
    console.log('Exporting', dataToExport.length, 'shipments');
    alert(`Exporting ${dataToExport.length} shipment(s) - Coming soon!`);
  }

  /**
   * Add alert for shipments - Open alert configuration dialog
   */
  addAlert(): void {
    console.log('Add alert clicked');
    
    if (this.selectedShipments.length === 0) {
      this.showToastMessage('Please select at least one shipment to add an alert.', 'warning');
      return;
    }
    
    // Open alert configuration dialog
    this.showAlertConfigDialog = true;
  }

  /**
   * Handle alert configuration save
   */
  onAlertConfigSave(config: any): void {
    console.log('Alert configuration saved:', config);
    
    // Set loading state
    this.isEmailSending = true;
    
    // Build email body with selected shipment details
    const shipmentDetails = this.selectedShipments.map(shipment => 
      `Shipment No: ${shipment.shipmentNo}\nPO No: ${shipment.poNo}\nMode of Transport: ${shipment.modeOfTransport}`
    ).join('\n\n');
    
    const emailRequest = {
      to: config.email || 'kedarnath.sahu@cozentus.com',
      subject: `Shipment Alert - ${this.selectedShipments.length} Shipment(s) Selected For Monitoring`,
      body: `The following shipments have been selected for alert:\n\n${shipmentDetails}`
    };
    
    // Build alert creation request
    const shipmentNumbers = this.selectedShipments.map(s => s.shipmentNo);
    const emailRecipients = config.email ? [config.email] : [];
    
    const alertRequest: CreateAlertRequest = {
      name: config.alertName || 'Shipment Alert',
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
    
    console.log('Creating alert with payload:', alertRequest);
    console.log('Sending alert email:', emailRequest);
    
    // Call both create alert and send email APIs
    this.alertsService.createAlert(alertRequest).subscribe({
      next: (alertResponse) => {
        console.log('Alert created successfully:', alertResponse);
        
        // Now send the email
        this.arrivalService.sendAlert(emailRequest).subscribe({
          next: (emailResponse) => {
            this.isEmailSending = false;
            console.log('Email alert response:', emailResponse);
            if (emailResponse.success) {
              this.showToastMessage('Alert created and email sent successfully', 'success');
              console.log('Email sent successfully:', emailResponse);
            } else {
              this.showToastMessage('Alert created but failed to send email', 'warning');
              console.error('Email send failed:', emailResponse);
            }
          },
          error: (emailError) => {
            this.isEmailSending = false;
            console.error('Error sending alert email:', emailError);
            this.showToastMessage('Alert created but failed to send email', 'warning');
          }
        });
      },
      error: (alertError) => {
        this.isEmailSending = false;
        console.error('Error creating alert:', alertError);
        this.showToastMessage('Failed to create alert', 'error');
      }
    });
  }

  /**
   * Handle alert configuration cancel
   */
  onAlertConfigCancel(): void {
    console.log('Alert configuration cancelled');
    this.showAlertConfigDialog = false;
  }

  /**
   * Open missing documents dialog
   */
  openMissingDocsDialog(shipment: any): void {
    this.selectedShipmentForDocs = shipment;
    this.showMissingDocsDialog = true;
    console.log('Opening missing documents dialog for:', shipment.shipmentNo);
  }

  /**
   * Get formatted tooltip for missing documents
   */
  getMissingDocsTooltip(shipment: any): string {
    if (!shipment.missingDocumentsList || shipment.missingDocumentsList.length === 0) {
      return 'No missing documents';
    }
    
    const docNames = shipment.missingDocumentsList.map((doc: any) => `• ${doc.name}`);
    return docNames.join('<br/>');
  }

  /**
   * Close missing documents dialog
   */
  closeMissingDocsDialog(): void {
    this.showMissingDocsDialog = false;
    this.selectedShipmentForDocs = null;
  }

  /**
   * Upload document
   */
  uploadDocument(document: any): void {
    console.log('Upload document:', document);
    this.currentDocumentForUpload = document;
    this.showMissingDocsDialog = false;
    this.showUploadDialog = true;
  }

  /**
   * Handle file upload
   */
  handleFileUpload(file: File): void {
    console.log('handleFileUpload called with file:', file);
    console.log('Document context:', this.currentDocumentForUpload);
    
    if (!this.currentDocumentForUpload) {
      console.error('No document context available');
      this.showUploadDialog = false;
      return;
    }

    const documentName = this.currentDocumentForUpload.name || 'Unknown Document';
    const shipmentId = this.selectedShipmentForDocs?.shipmentId;

    console.log('Starting upload with:', { documentName, shipmentId, fileName: file.name });

    // Call the upload API
    this.arrivalService.uploadDocument(documentName, file, shipmentId).subscribe({
      next: (response) => {
        console.log('Upload API response:', response);
        
        // Check if upload was successful based on status field
        const isSuccess = response.status === 'Uploaded' || response.success === true;
        
        if (isSuccess) {
          console.log('✓ Upload successful:', response);
          
          // Update the document in the list
          this.currentDocumentForUpload.document = file.name;
          this.currentDocumentForUpload.uploaded = true;
          
          this.showToastMessage('Document Uploaded Successfully', 'success');
        } else {
          console.error('✗ Upload failed:', response.message || response.status);
          this.showToastMessage('Failed to upload document', 'error');
        }
      },
      error: (error) => {
        console.error('✗ Upload error:', error);
        this.showToastMessage('Failed to upload document', 'error');
      },
      complete: () => {
        console.log('Upload process completed - closing dialog');
        this.showUploadDialog = false;
        this.currentDocumentForUpload = null;
      }
    });
  }

  /**
   * Handle upload cancel - only when user explicitly cancels
   */
  handleUploadCancel(): void {
    console.log('Upload explicitly cancelled by user');
    this.showUploadDialog = false;
    this.currentDocumentForUpload = null;
  }

  /**
   * Format date for API (YYYY-MM-DD)
   */
  private formatDateForApi(date?: Date | null): string {
    if (!date) {
      return new Date().toISOString().split('T')[0];
    }
    
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    
    return d.toISOString().split('T')[0];
  }

  /**
   * Download document
   */
  downloadDocument(document: any): void {
    console.log('Download document:', document);
    // TODO: Implement file download logic
    alert('Download functionality - Coming soon!');
  }

  /**
   * Delete document
   */
  deleteDocument(document: any): void {
    console.log('Delete document:', document);
    // TODO: Implement file delete logic
    if (confirm('Are you sure you want to delete this document?')) {
      alert('Delete functionality - Coming soon!');
    }
  }

  /**
   * Show toast message
   */
  showToastMessage(message: string, type: ToastType = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
  }

  /**
   * Handle toast dismissal
   */
  onToastDismissed(): void {
    this.showToast = false;
  }

  private getStatusIdForActiveKpi(): number {
    return this.kpiStatusMap[this.activeKpiId] ?? 101;
  }

  openShipmentConfig(shipment: any): void {
    console.log('Opening shipment config for:', shipment);
    // Store the entire shipment object as JSON
    sessionStorage.setItem('selectedShipmentNo', JSON.stringify(shipment));
    // Navigate using shipmentNo instead of shipmentId
    this.router.navigate(['/arrival/shipment', shipment.shipmentNo || shipment.shipmentId]);
  }
}
