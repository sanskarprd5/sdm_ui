import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ArrivalService, ShipmentArrivalRequest, StatusCountsResponse } from './arrival.service';

describe('ArrivalService', () => {
  let service: ArrivalService;
  let httpMock: HttpTestingController;
  const API_BASE = 'http://192.168.0.43:8080/smart-sdm-api/api/v1';
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    spyOn(window.localStorage, 'getItem').and.callFake((key: string) => storage[key] ?? null);
    spyOn(window.localStorage, 'setItem').and.callFake((key: string, value: string) => {
      storage[key] = value;
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(ArrivalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const buildStatusCounts = (): StatusCountsResponse => ({
    arrival: [{ statusId: 1, label: 'Arriving', count: 5 }],
    carrierRelease: [],
    customDeclaration: [],
    deliveryPlan: []
  });

  it('should return mock status counts when bypass token is set', () => {
    storage['accessToken'] = 'bypass-mock-access-token';

    let result: StatusCountsResponse | undefined;
    service.getStatusCounts().subscribe(res => (result = res));

    httpMock.expectNone(`${API_BASE}/shipments/status-counts`);
    const fallback = (service as any).getMockStatusCounts() as StatusCountsResponse;
    expect(result).toEqual(fallback);
  });

  it('should fetch status counts from API when not bypassing', () => {
    const payload = buildStatusCounts();

    service.getStatusCounts().subscribe(res => {
      expect(res).toEqual(payload);
    });

    const req = httpMock.expectOne(`${API_BASE}/shipments/status-counts`);
    expect(req.request.method).toBe('GET');
    req.flush(payload);
  });

  it('should fall back to mock counts when status request fails', () => {
    let result: StatusCountsResponse | undefined;

    service.getStatusCounts().subscribe(res => (result = res));

    const req = httpMock.expectOne(`${API_BASE}/shipments/status-counts`);
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    const fallback = (service as any).getMockStatusCounts() as StatusCountsResponse;
    expect(result).toEqual(fallback);
  });

  it('should map arrival shipments into UI shape', () => {
    spyOn(Math, 'random').and.returnValue(0); // ensure deterministic missing doc count
    const request: ShipmentArrivalRequest = { statusId: 101, page: 1, size: 10 };
    const apiResponse = {
      status: 'SUCCESS',
      message: 'ok',
      data: {
        content: [
          {
            shipmentId: 7,
            bdpReferenceNo: 'BDP-7',
            poNo: 'PO-1',
            customerName: 'ACME',
            modeOfTransport: 'Air',
            arrivalPortName: 'Houston',
            arrivalCountryName: 'USA',
            eta: '2025-02-10T00:00:00Z'
          }
        ],
        pageNumber: 1,
        pageSize: 10,
        totalElements: 1,
        totalPages: 1,
        last: true
      }
    };

    service.getArrivalShipments(request).subscribe(result => {
      expect(result.shipments.length).toBe(1);
      expect(result.totalRecords).toBe(1);
      expect(result.shipments[0].shipmentNo).toBe('BDP-7');
      expect(result.shipments[0].portOfArrival).toBe('Houston, USA');
      expect(result.shipments[0].missingDocuments).toBe('1 Document');
    });

    const req = httpMock.expectOne(`${API_BASE}/shipment-arrival-details/getDetailsByCard`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(apiResponse);
  });

  it('should return empty shipment page when API call fails', () => {
    const request: ShipmentArrivalRequest = { statusId: 101, page: 2, size: 25 };

    service.getArrivalShipments(request).subscribe(result => {
      expect(result.shipments).toEqual([]);
      expect(result.totalRecords).toBe(0);
      expect(result.pageNumber).toBe(2);
      expect(result.pageSize).toBe(25);
    });

    const req = httpMock.expectOne(`${API_BASE}/shipment-arrival-details/getDetailsByCard`);
    req.flush('error', { status: 500, statusText: 'Server Error' });
  });

  it('should pluck arrival status counts', () => {
    const counts = buildStatusCounts();
    spyOn(service, 'getStatusCounts').and.returnValue(of(counts));

    service.getArrivalStatusCounts().subscribe(res => {
      expect(res).toEqual(counts.arrival);
    });
  });

  it('should send alert emails and return success for 200 responses', () => {
    const payload = { to: 'ops@example.com', subject: 'Alert', body: 'Details' };

    service.sendAlert(payload).subscribe(response => {
      expect(response).toEqual({ success: true, message: 'Email sent successfully' });
    });

    const req = httpMock.expectOne(`${API_BASE}/mail/send`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush('OK', { status: 200, statusText: 'OK' });
  });

  it('should surface alert send errors as friendly messages', () => {
    const payload = { to: 'ops@example.com', subject: 'Alert', body: 'Details' };

    service.sendAlert(payload).subscribe(response => {
      expect(response.success).toBeFalse();
      expect(response.message).toContain('Http failure response');
    });

    const req = httpMock.expectOne(`${API_BASE}/mail/send`);
    req.flush({ message: 'Failed to send email' }, { status: 500, statusText: 'Server Error' });
  });

  it('should upload documents and mark success when API reports uploaded status', () => {
    const file = new File(['test'], 'manifest.pdf', { type: 'application/pdf' });

    service.uploadDocument('Manifest', file, '42').subscribe(response => {
      expect(response.success).toBeTrue();
      expect(response.status).toBe('Uploaded');
    });

    const req = httpMock.expectOne(`${API_BASE}/documents/upload`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    const formData = req.request.body as FormData;
    expect(formData.get('documentName')).toBe('Manifest');
    expect(formData.get('shipmentId')).toBe('42');
    req.flush({ status: 'Uploaded', id: 7 });
  });

  it('should return friendly response when document upload fails', () => {
    const file = new File(['test'], 'manifest.pdf', { type: 'application/pdf' });

    service.uploadDocument('Manifest', file).subscribe(response => {
      expect(response.success).toBeFalse();
      expect(response.message).toBe('Server exploded');
    });

    const req = httpMock.expectOne(`${API_BASE}/documents/upload`);
    req.flush({ message: 'Server exploded' }, { status: 500, statusText: 'Server Error' });
  });
});
