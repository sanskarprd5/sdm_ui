import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Shipment } from './arrival.model';

// API Response Interfaces
export interface GlobalFilter {
  fieldName: string;
  fieldValue: string;
}

export interface ColumnFilter {
  columnName: string;
  columnValue: string;
  filterOperator: string; // 'Starts with', 'Contains', etc.
}

export interface OrderConfig {
  column: string;
  dir: 'asc' | 'desc';
}

export interface TableDataRequest {
  cardId: number;
  pageNo: number;
  pageSize: number;
  keyFilter?: string;
  order?: OrderConfig;
  globalFilter?: GlobalFilter[];
  columnFilter?: ColumnFilter[];
}

export interface StatusCountRequest {
  globalFilter?: GlobalFilter[];
}

export interface StatusCount {
  cardId?: number;
  statusId?: number;  // For backward compatibility
  label: string;
  count: number;
}

export interface StatusCountsResponse {
  pageNo: number;
  pageSize: number;
  totalCount: number;
  order: {
    column: string;
    dir: string;
  };
  globalFilter: GlobalFilter[];
  data: [{
    arrival: StatusCount[];
    carrierRelease: StatusCount[];
    customDeclaration: StatusCount[];
    deliveryPlan: StatusCount[];
  }];
  // Flattened properties for backward compatibility
  arrival?: StatusCount[];
  carrierRelease?: StatusCount[];
  customDeclaration?: StatusCount[];
  deliveryPlan?: StatusCount[];
}

export interface EmailRequest {
  to: string;
  subject: string;
  body: string;
}

export interface EmailResponse {
  success: boolean;
  message?: string;
}

export interface DocumentUploadRequest {
  documentName: string;
  documentType: string;
  shipmentId?: string;
  file: File;
}

export interface DocumentUploadResponse {
  id?: number;
  documentName?: string;
  documentType?: string;
  size?: number;
  storagePath?: string;
  status?: string;
  // Fallback fields for error responses
  success?: boolean;
  message?: string;
}

export interface ShipmentArrivalRequest {
  statusId: number;
  status?: string;
  page: number;
  size: number;
}

export interface ShipmentArrivalResponse {
  status: string;
  message: string;
  data: ShipmentArrivalPage;
}

export interface ShipmentArrivalPage {
  content: ShipmentArrivalItem[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ShipmentArrivalItem {
  shipmentId: number;
  bdpReferenceNo: string | null;
  poNo: string | null;
  customerName: string | null;
  sourceSystemId?: number | null;
  sourceSystemName?: string | null;
  modeOfTransport?: string | null;
  modeOfTransportId?: number | null;
  moveTypeDescription?: string | null;
  carrierName?: string | null;
  hbl?: string | null;
  portOfDeparture?: string | null;
  portOfTransit?: string | null;
  portOfArrival?: string | null;
  arrivalPortName?: string | null;
  arrivalCountryName?: string | null;
  placeOfDeliveryUnloc?: string | null;
  documentDistributionReceived?: string | null;
  atd?: string | null;
  eta?: string | null;
  predictiveEta?: string | null;
  latestEta?: string | null;
  ata?: string | null;
  carrierReleaseRequest?: string | null;
  releaseReceivedFromCarrier?: string | null;
}

export interface ShipmentPageResult {
  shipments: Shipment[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
}

export interface TableDataResponse {
  cardId: number;
  pageNo: number;
  pageSize: number;
  totalCount: number;
  order: OrderConfig;
  globalFilter: GlobalFilter[];
  data: TableDataItem[];
}

export interface TableDataItem {
  id: number;
  bdpReferenceNo: string;
  customerReferenceNo: string | null;
  poNo: string | null;
  customerCode: string;
  customerName: string | null;
  sourceSystem: string | null;
  bdpRepresentativeName: string;
  modeOfTransport: string;
  moveTypeDescription: string | null;
  incoterm: string;
  carrierId: number;
  carrierName: string;
  masterBolNo: string | null;
  hblNo: string;
  departureCountry: string | null;
  departureCountryId: number;
  departurePortUnloc: string;
  departurePortId: number;
  arrivalCountry: string | null;
  arrivalCountryId: number;
  arrivalPortUnloc: string;
  arrivalPortId: number;
  arrivalTerminalName: string;
  placeOfDelivery: string;
  placeOfDeliveryUnloc: string;
  vesselName: string;
  vesselCode: string;
  transitPort: string | null;
  transitPortId: number | null;
  bol: string;
  groupCode: number;
  geid: number;
  bdpServiceCode: string;
  productName: string | null;
  quantity: string | null;
  hsCode: string | null;
  bookingETA: string | null;
  predictiveETA: string | null;
  latestETA: string | null;
  depatureDate: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ArrivalService {
  private readonly API_BASE_URL = 'http://192.168.0.43:8080/smart-sdm-api/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Get status counts for all shipment stages
   */
  getStatusCounts(globalFilter?: GlobalFilter[]): Observable<StatusCountsResponse> {
    // Check if using bypass login (mock credentials)
    const accessToken = localStorage.getItem('accessToken');
    const isBypassLogin = accessToken === 'bypass-mock-access-token';
    
    if (isBypassLogin) {
      console.log('⚠ Bypass login detected - using mock status counts (no API call)');
      return of(this.getMockStatusCounts());
    }

    const requestBody: StatusCountRequest = {
      globalFilter: globalFilter || []
    };

    return this.http.post<StatusCountsResponse>(
      `${this.API_BASE_URL}/common/shipmentStatusCount`,
      requestBody
    ).pipe(
      map(response => {
        // Extract the nested data structure
        if (response.data && response.data.length > 0) {
          return {
            ...response,
            arrival: response.data[0].arrival,
            carrierRelease: response.data[0].carrierRelease,
            customDeclaration: response.data[0].customDeclaration,
            deliveryPlan: response.data[0].deliveryPlan
          } as any;
        }
        return response;
      }),
      catchError(error => {
        console.error('Error fetching status counts:', error);
        console.log('Using mock status counts as fallback');
        return of(this.getMockStatusCounts());
      })
    );
  }

  /**
   * Search table view data with filtering, sorting, and pagination
   * New unified endpoint for table data
   */
  searchTableViewData(request: TableDataRequest): Observable<ShipmentPageResult> {
    const url = `${this.API_BASE_URL}/arrival/searchTableViewData`;
    
    return this.http.post<TableDataResponse>(url, request)
      .pipe(
        map(response => this.mapTableDataResponse(response)),
        catchError(error => {
          console.error('Error fetching table data:', error);
          return of(this.getEmptyTableDataPage(request));
        })
      );
  }

  /**
   * Fetch paged arrival shipments (deprecated - use searchTableViewData)
   */
  getArrivalShipments(request: ShipmentArrivalRequest): Observable<ShipmentPageResult> {
    const url = `${this.API_BASE_URL}/shipment-arrival-details/getDetailsByCard`;
    return this.http.post<ShipmentArrivalResponse>(url, request)
      .pipe(
        map(response => this.mapShipmentPage(response.data)),
        catchError(error => {
          console.error('Error fetching arrival shipments:', error);
          return of(this.getEmptyShipmentPage(request));
        })
      );
  }

  /**
   * Get arrival status counts
   */
  getArrivalStatusCounts(globalFilter?: GlobalFilter[]): Observable<StatusCount[]> {
    return this.getStatusCounts(globalFilter).pipe(
      map(response => response.arrival || [])
    );
  }

  /**
   * Get mock status counts for fallback
   */
  private getMockStatusCounts(): any {
    return {
      pageNo: 1,
      pageSize: 40,
      totalCount: 0,
      order: {
        column: '',
        dir: ''
      },
      globalFilter: [],
      data: [{
        arrival: [
          {
            cardId: 101,
            label: 'Incomplete Document',
            count: 190957
          },
          {
            cardId: 102,
            label: 'Arriving',
            count: 32052
          },
          {
            cardId: 104,
            label: 'Shipment Early',
            count: 1
          },
          {
            cardId: 105,
            label: 'Arrived',
            count: 32052
          },
          {
            cardId: 106,
            label: 'All Shipments',
            count: 255062
          }
        ],
        carrierRelease: [
          {
            cardId: 201,
            label: 'Carrier Release Requested',
            count: 2
          },
          {
            cardId: 202,
            label: 'Carrier Approved',
            count: 2
          },
          {
            cardId: 203,
            label: 'Carrier Declined',
            count: 1
          }
        ],
        customDeclaration: [
          {
            cardId: 301,
            label: 'Custom Document Pending',
            count: 2
          },
          {
            cardId: 302,
            label: 'Custom Document Submitted',
            count: 2
          },
          {
            cardId: 303,
            label: 'Custom Query',
            count: 2
          }
        ],
        deliveryPlan: [
          {
            cardId: 401,
            label: 'Incoming Forecast',
            count: 2
          },
          {
            cardId: 404,
            label: 'Delivery Booking Request Submitted',
            count: 1
          },
          {
            cardId: 407,
            label: 'Empty Container Return',
            count: 1
          }
        ]
      }],
      // Flatten for backward compatibility
      arrival: [],
      carrierRelease: [],
      customDeclaration: [],
      deliveryPlan: []
    };
  }

  /**
   * Send alert email for selected shipments
   * @param emailRequest - Email details
   */
  sendAlert(emailRequest: EmailRequest): Observable<EmailResponse> {
    return this.http.post(`${this.API_BASE_URL}/mail/send`, emailRequest, { 
      observe: 'response',
      responseType: 'text'
    })
      .pipe(
        map(response => {
          console.log('Full Email API response:', response);
          console.log('Response status:', response.status);
          console.log('Response body:', response.body);
          
          // Check if status code is 200 for success
          if (response.status === 200) {
            return { success: true, message: 'Email sent successfully' };
          } else {
            return { success: false, message: `HTTP ${response.status}: ${response.statusText}` };
          }
        }),
        catchError(error => {
          console.error('Error sending alert email:', error);
          return of({ 
            success: false, 
            message: error.error?.message || error.message || 'Failed to send email' 
          });
        })
      );
  }

  /**
   * Upload document for shipment using multipart/form-data
   * @param documentName - Name of the document being uploaded
   * @param file - File to upload
   * @param shipmentId - Optional shipment ID
   */
  uploadDocument(documentName: string, file: File, shipmentId?: string): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    
    // Match the exact form fields from Postman request
    formData.append('documentName', documentName);
    formData.append('documentType', file.type);
    formData.append('file', file, file.name);
    
    // Add shipmentId if provided
    if (shipmentId) {
      formData.append('shipmentId', shipmentId);
    }

    const uploadUrl = `${this.API_BASE_URL}/documents/upload`;

    // HttpClient automatically adds Authorization header from interceptor
    // and sets Content-Type to multipart/form-data with boundary
    return this.http.post<DocumentUploadResponse>(uploadUrl, formData)
      .pipe(
        map(response => {
          console.log('✓ Document upload response:', response);
          // Check if status is 'Uploaded' for success
          if (response.status === 'Uploaded') {
            return { ...response, success: true };
          }
          return response;
        }),
        catchError(error => {
          console.error('✗ Error uploading document:', error);
          return of({ 
            success: false, 
            message: error.error?.message || error.message || 'Failed to upload document' 
          });
        })
      );
  }

  private mapTableDataResponse(response: TableDataResponse): ShipmentPageResult {
    const shipments = response.data?.map(item => this.mapTableDataItem(item)) ?? [];
    return {
      shipments,
      totalRecords: response.totalCount,
      pageNumber: response.pageNo - 1, // API uses 1-based, UI uses 0-based
      pageSize: response.pageSize
    };
  }

  private getEmptyTableDataPage(request: TableDataRequest): ShipmentPageResult {
    return {
      shipments: [],
      totalRecords: 0,
      pageNumber: request.pageNo - 1,
      pageSize: request.pageSize
    };
  }

  private mapTableDataItem(item: TableDataItem): Shipment {
    // Generate missing documents count randomly for demo
    const missingDocsCount = Math.floor(Math.random() * 5);
    const missingDocsList = missingDocsCount > 0 ? Array.from({ length: missingDocsCount }, (_, i) => ({
      name: `Document ${i + 1}`,
      document: null,
      uploaded: false
    })) : undefined;

    return {
      shipmentId: item.id,
      shipmentNo: item.bdpReferenceNo || '--',
      poNo: item.poNo || '--',
      customerName: item.customerName || '--',
      sourceSystem: item.sourceSystem || '--',
      bdpRepresentativeName: item.bdpRepresentativeName || '--',
      modeOfTransport: item.modeOfTransport || '--',
      moveTypeDescription: item.moveTypeDescription || '--',
      carrierName: item.carrierName || '--',
      hbl: item.hblNo || '--',
      portOfDeparture: item.departurePortUnloc || '--',
      portOfTransit: item.transitPort || '--',
      portOfArrival: item.arrivalPortUnloc || '--',
      placeOfDeliveryUnloc: item.placeOfDeliveryUnloc || '--',
      documentDistributionReceived: '--', // Not in API response
      atd: this.formatDate(item.depatureDate),
      eta: this.formatDate(item.bookingETA),
      predictiveETA: this.formatDate(item.predictiveETA),
      latestEta: this.formatDate(item.latestETA),
      ata: '--', // Not in API response
      carrierReleaseRequest: '--', // Not in API response
      releaseReceivedFromCarrier: '--', // Not in API response
      transportMode: item.modeOfTransport,
      missingDocuments: missingDocsCount > 0 ? `${missingDocsCount} Document${missingDocsCount > 1 ? 's' : ''}` : '0 Documents',
      missingDocumentsList: missingDocsList,
      source: item.departurePortUnloc || '--',
      originalETA: this.formatDate(item.bookingETA)
    };
  }

  private mapShipmentPage(page: ShipmentArrivalPage): ShipmentPageResult {
    const shipments = page.content?.map(item => this.mapShipment(item)) ?? [];
    return {
      shipments,
      totalRecords: page.totalElements ?? shipments.length,
      pageNumber: page.pageNumber ?? 0,
      pageSize: page.pageSize ?? (shipments.length || 10)
    };
  }

  private getEmptyShipmentPage(request: ShipmentArrivalRequest): ShipmentPageResult {
    return {
      shipments: [],
      totalRecords: 0,
      pageNumber: request.page ?? 0,
      pageSize: request.size
    };
  }

  private mapShipment(item: ShipmentArrivalItem): Shipment {
    const transportMode = this.getModeOfTransport(item);
    const missingDocsCount = Math.floor(Math.random() * 5) + 1; // Random 1-5
    const missingDocsList = Array.from({ length: missingDocsCount }, (_, i) => ({
      name: `Document ${i + 1}`,
      document: null,
      uploaded: false
    }));
    
    return {
      shipmentId: item.shipmentId,
      shipmentNo: item.bdpReferenceNo || '--',
      poNo: item.poNo || '--',
      customerName: item.customerName || '--',
      sourceSystem: this.getSourceSystemName(item),
      bdpRepresentativeName: '--',
      modeOfTransport: transportMode,
      moveTypeDescription: item.moveTypeDescription || '--',
      carrierName: item.carrierName || '--',
      hbl: item.hbl || '--',
      portOfDeparture: item.portOfDeparture || '--',
      portOfTransit: item.portOfTransit || '--',
      portOfArrival: item.portOfArrival || this.getArrivalLocation(item),
      placeOfDeliveryUnloc: item.placeOfDeliveryUnloc || '--',
      documentDistributionReceived: item.documentDistributionReceived || '--',
      atd: this.formatDate(item.atd),
      eta: this.formatDate(item.eta),
      predictiveETA: this.formatDate(item.predictiveEta),
      latestEta: this.formatDate(item.latestEta),
      ata: this.formatDate(item.ata),
      carrierReleaseRequest: item.carrierReleaseRequest || '--',
      releaseReceivedFromCarrier: item.releaseReceivedFromCarrier || '--',
      transportMode,
      missingDocuments: `${missingDocsCount} Document${missingDocsCount > 1 ? 's' : ''}`,
      missingDocumentsList: missingDocsList,
      source: this.getArrivalLocation(item),
      originalETA: this.formatDate(item.eta)
    };
  }

  private getSourceSystemName(item: ShipmentArrivalItem): string {
    if (item.sourceSystemName) {
      return item.sourceSystemName;
    }
    if (item.sourceSystemId) {
      return `Source-${item.sourceSystemId}`;
    }
    return '--';
  }

  private getModeOfTransport(item: ShipmentArrivalItem): string {
    if (item.modeOfTransport) {
      return item.modeOfTransport;
    }
    if (item.modeOfTransportId) {
      const modeMap: Record<number, string> = {
        23: 'Air',
        24: 'Ocean',
        25: 'Rail'
      };
      return modeMap[item.modeOfTransportId] || `Mode-${item.modeOfTransportId}`;
    }
    return '--';
  }

  private getArrivalLocation(item: ShipmentArrivalItem): string {
    if (item.arrivalPortName && item.arrivalCountryName) {
      return `${item.arrivalPortName}, ${item.arrivalCountryName}`;
    }
    return item.arrivalPortName || item.arrivalCountryName || '--';
  }

  private formatDate(value?: string | null): string {
    if (!value) {
      return '--';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '--';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }
}
