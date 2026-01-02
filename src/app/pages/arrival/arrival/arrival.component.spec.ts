import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ArrivalComponent } from './arrival.component';
import { ArrivalService } from '../arrival.service';
import { AlertsService } from '../../alerts/alerts/alerts.service';

describe('ArrivalComponent', () => {
  let component: ArrivalComponent;
  let fixture: ComponentFixture<ArrivalComponent>;
  let arrivalService: jasmine.SpyObj<ArrivalService>;
  let alertsService: jasmine.SpyObj<AlertsService>;
  let router: Router;
  let routerNavigateSpy: jasmine.Spy;

  const mockShipment = {
    shipmentId: 1,
    shipmentNo: 'SHIP001',
    poNo: 'PO001',
    customerName: 'Test Customer',
    sourceSystem: 'SAP',
    bdpRepresentativeName: 'John Doe',
    modeOfTransport: 'Sea',
    carrierName: 'Test Carrier',
    portOfDeparture: 'Port A',
    portOfArrival: 'Port B',
    eta: '2025-12-15'
  };

  beforeEach(async () => {
    const arrivalServiceSpy = jasmine.createSpyObj('ArrivalService', [
      'getArrivalShipments',
      'getArrivalStatusCounts',
      'sendAlert',
      'uploadDocument'
    ]);
    const alertsServiceSpy = jasmine.createSpyObj('AlertsService', ['createAlert']);
    await TestBed.configureTestingModule({
      imports: [ArrivalComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: ArrivalService, useValue: arrivalServiceSpy },
        { provide: AlertsService, useValue: alertsServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArrivalComponent);
    component = fixture.componentInstance;
    arrivalService = TestBed.inject(ArrivalService) as jasmine.SpyObj<ArrivalService>;
    alertsService = TestBed.inject(AlertsService) as jasmine.SpyObj<AlertsService>;
    router = TestBed.inject(Router);
    routerNavigateSpy = spyOn(router, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize table headers and load KPI counts', () => {
      spyOn(component, 'loadKpiCounts');
      spyOn(component, 'loadShipments');

      component.ngOnInit();

      expect(component.loadKpiCounts).toHaveBeenCalled();
      expect(component.loadShipments).toHaveBeenCalled();
    });
  });

  describe('loadShipments', () => {
    it('should load shipments successfully for non-bypass user', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ username: 'testuser' }));
      const mockResponse = {
        shipments: [mockShipment],
        totalRecords: 1,
        pageNumber: 0,
        pageSize: 10
      };
      arrivalService.getArrivalShipments.and.returnValue(of(mockResponse));

      component.loadShipments(0);

      expect(component.shipments.length).toBe(1);
      expect(component.totalRecords).toBe(1);
    });

    it('should load dummy data for sanskar user', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ username: 'sanskar' }));
      spyOn<any>(component, 'loadDummyData');

      component.loadShipments(0);

      expect(component['loadDummyData']).toHaveBeenCalled();
    });
  });

  describe('loadKpiCounts', () => {
    it('should load KPI counts successfully', () => {
      const mockCounts = [
        { statusId: 101, label: 'Arriving', count: 10 },
        { statusId: 102, label: 'Incomplete', count: 5 }
      ];
      arrivalService.getArrivalStatusCounts.and.returnValue(of(mockCounts));

      component.loadKpiCounts();

      expect(arrivalService.getArrivalStatusCounts).toHaveBeenCalled();
    });

    it('should handle error when loading KPI counts fails', () => {
      arrivalService.getArrivalStatusCounts.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');

      component.loadKpiCounts();

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('onKpiSelected', () => {
    it('should update active KPI and reload shipments', () => {
      spyOn(component, 'loadShipments');
      const kpiId = component.kpiCards[1].id;

      component.onKpiSelected(kpiId);

      expect(component.activeKpiId).toBe(kpiId);
      expect(component.loadShipments).toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should update pagination and reload shipments', () => {
      spyOn(component, 'loadShipments');
      const event = { first: 10, rows: 10 };

      component.onPageChange(event);

      expect(component.first).toBe(10);
      expect(component.pageSize).toBe(10);
      expect(component.loadShipments).toHaveBeenCalledWith(1);
    });
  });

  describe('openShipmentConfig', () => {
    it('should store shipment in sessionStorage and navigate', () => {
      spyOn(sessionStorage, 'setItem');

      component.openShipmentConfig(mockShipment);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'selectedShipmentNo',
        JSON.stringify(mockShipment)
      );
      expect(routerNavigateSpy).toHaveBeenCalledWith([
        '/arrival/shipment',
        mockShipment.shipmentNo
      ]);
    });
  });

  describe('addAlert', () => {
    it('should show alert dialog when shipments are selected', () => {
      component.selectedShipments = [mockShipment as any];

      component.addAlert();

      expect(component.showAlertConfigDialog).toBe(true);
    });

    it('should show toast when no shipments are selected', () => {
      spyOn(component, 'showToastMessage');
      component.selectedShipments = [];

      component.addAlert();

      expect(component.showToastMessage).toHaveBeenCalled();
      expect(component.showAlertConfigDialog).toBe(false);
    });
  });

  describe('onAlertConfigSave', () => {
    const mockConfig = {
      alertName: 'Test Alert',
      email: 'test@example.com',
      emailChecked: true,
      notification: true,
      shipmentNos: ['SHIP001'],
      thresholdDays: 7,
      hazardousGoods: false,
      companyName: 'Company A',
      carrier: 'Carrier B',
      portOfDeparture: 'Port X',
      portOfArrival: 'Port Y',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31')
    };

    beforeEach(() => {
      component.selectedShipments = [mockShipment as any];
    });

    it('should create alert and send email successfully', () => {
      const mockAlert = { id: 1, name: 'Test Alert' } as any;
      alertsService.createAlert.and.returnValue(of(mockAlert));
      arrivalService.sendAlert.and.returnValue(of({ success: true }));
      spyOn(component, 'showToastMessage');

      component.onAlertConfigSave(mockConfig);

      expect(alertsService.createAlert).toHaveBeenCalled();
      expect(arrivalService.sendAlert).toHaveBeenCalled();
      expect(component.showToastMessage).toHaveBeenCalledWith(
        'Alert created and email sent successfully',
        'success'
      );
      expect(component.isEmailSending).toBe(false);
    });

    it('should handle alert creation failure', () => {
      alertsService.createAlert.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(component, 'showToastMessage');

      component.onAlertConfigSave(mockConfig);

      expect(component.showToastMessage).toHaveBeenCalledWith(
        'Failed to create alert',
        'error'
      );
      expect(component.isEmailSending).toBe(false);
    });

    it('should handle email send failure after alert creation', () => {
      const mockAlert = { id: 1, name: 'Test Alert' } as any;
      alertsService.createAlert.and.returnValue(of(mockAlert));
      arrivalService.sendAlert.and.returnValue(throwError(() => new Error('Email Error')));
      spyOn(component, 'showToastMessage');

      component.onAlertConfigSave(mockConfig);

      expect(component.showToastMessage).toHaveBeenCalledWith(
        'Alert created but failed to send email',
        'warning'
      );
    });
  });

  describe('onAlertConfigCancel', () => {
    it('should close alert dialog', () => {
      component.showAlertConfigDialog = true;

      component.onAlertConfigCancel();

      expect(component.showAlertConfigDialog).toBe(false);
    });
  });

  describe('handleFileUpload', () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    beforeEach(() => {
      component.currentDocumentForUpload = { name: 'Test Document' };
      component.selectedShipmentForDocs = { shipmentId: 1 };
    });

    it('should upload document successfully', () => {
      const mockResponse = { status: 'Uploaded', success: true };
      arrivalService.uploadDocument.and.returnValue(of(mockResponse));
      spyOn(component, 'showToastMessage');

      component.handleFileUpload(mockFile);

      expect(arrivalService.uploadDocument).toHaveBeenCalled();
      expect(component.showToastMessage).toHaveBeenCalledWith(
        'Document Uploaded Successfully',
        'success'
      );
      expect(component.showUploadDialog).toBe(false);
    });

    it('should handle upload failure', () => {
      arrivalService.uploadDocument.and.returnValue(throwError(() => new Error('Upload Error')));
      spyOn(component, 'showToastMessage');

      component.handleFileUpload(mockFile);

      expect(component.showToastMessage).toHaveBeenCalledWith(
        'Failed to upload document',
        'error'
      );
      expect(component.showUploadDialog).toBe(false);
    });

    it('should handle unsuccessful upload response', () => {
      const mockResponse = { status: 'Failed', success: false, message: 'Error' };
      arrivalService.uploadDocument.and.returnValue(of(mockResponse));
      spyOn(component, 'showToastMessage');

      component.handleFileUpload(mockFile);

      expect(component.showToastMessage).toHaveBeenCalledWith(
        'Failed to upload document',
        'error'
      );
    });
  });

  describe('handleUploadCancel', () => {
    it('should close upload dialog and clear document', () => {
      component.showUploadDialog = true;
      component.currentDocumentForUpload = { name: 'Test' };

      component.handleUploadCancel();

      expect(component.showUploadDialog).toBe(false);
      expect(component.currentDocumentForUpload).toBeNull();
    });
  });

  describe('formatDateForApi', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-12-01');
      const result = component['formatDateForApi'](date);
      expect(result).toBe('2025-12-01');
    });

    it('should return current date for null', () => {
      const result = component['formatDateForApi'](null);
      const today = new Date().toISOString().split('T')[0];
      expect(result).toBe(today);
    });
  });

  describe('showToastMessage', () => {
    it('should set toast state', () => {
      component.showToastMessage('Test message', 'success');

      expect(component.toastMessage).toBe('Test message');
      expect(component.toastType).toBe('success');
      expect(component.showToast).toBeTrue();
    });

    it('should hide toast when dismissed', () => {
      component.showToast = true;

      component.onToastDismissed();

      expect(component.showToast).toBeFalse();
    });
  });

  describe('openMissingDocsDialog', () => {
    it('should open missing documents dialog', () => {
      component.openMissingDocsDialog(mockShipment);

      expect(component.selectedShipmentForDocs).toBe(mockShipment);
      expect(component.showMissingDocsDialog).toBe(true);
    });
  });

  describe('closeMissingDocsDialog', () => {
    it('should close missing documents dialog', () => {
      component.showMissingDocsDialog = true;
      component.selectedShipmentForDocs = mockShipment;

      component.closeMissingDocsDialog();

      expect(component.showMissingDocsDialog).toBe(false);
      expect(component.selectedShipmentForDocs).toBeNull();
    });
  });
});
