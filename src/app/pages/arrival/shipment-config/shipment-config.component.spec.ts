import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ShipmentConfigComponent } from './shipment-config.component';
import { ArrivalService } from '../arrival.service';
import { Shipment } from '../arrival.model';

describe('ShipmentConfigComponent', () => {
  let component: ShipmentConfigComponent;
  let fixture: ComponentFixture<ShipmentConfigComponent>;
  let arrivalService: jasmine.SpyObj<ArrivalService>;
  let router: Router;
  let routerNavigateSpy: jasmine.Spy;
  let activatedRoute: ActivatedRoute;

  const mockShipment: Shipment = {
    shipmentId: 1,
    shipmentNo: 'SHIP001',
    poNo: 'PO001',
    customerName: 'Customer A',
    sourceSystem: 'SAP',
    bdpRepresentativeName: 'John Doe',
    modeOfTransport: 'OCEAN',
    moveTypeDescription: 'Import',
    carrierName: 'Maersk',
    hbl: 'HBL123',
    portOfDeparture: 'Mumbai, India',
    portOfTransit: 'Singapore',
    portOfArrival: 'Houston, USA',
    placeOfDeliveryUnloc: 'USHOU',
    documentDistributionReceived: 'Yes',
    carrierReleaseRequest: 'Pending',
    releaseReceivedFromCarrier: 'No',
    atd: '2025-01-15',
    eta: '2025-02-10',
    predictiveETA: '2025-02-09',
    latestEta: '2025-02-11',
    ata: null,
    hazardousGoods: false,
    status: 102
  } as any;

  beforeEach(async () => {
    const arrivalServiceSpy = jasmine.createSpyObj('ArrivalService', ['getArrivalShipments']);
    await TestBed.configureTestingModule({
      imports: [ShipmentConfigComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: ArrivalService, useValue: arrivalServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ shipmentNo: 'SHIP001' })
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipmentConfigComponent);
    component = fixture.componentInstance;
    arrivalService = TestBed.inject(ArrivalService) as jasmine.SpyObj<ArrivalService>;
    router = TestBed.inject(Router);
    routerNavigateSpy = spyOn(router, 'navigate');
    activatedRoute = TestBed.inject(ActivatedRoute);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load shipment from sessionStorage when available', () => {
      spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify(mockShipment));
      spyOn(sessionStorage, 'removeItem');
      spyOn(component, 'populateFormFromShipment');

      component.ngOnInit();

      expect(sessionStorage.getItem).toHaveBeenCalledWith('selectedShipmentNo');
      expect(component.populateFormFromShipment).toHaveBeenCalledWith(mockShipment);
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('selectedShipmentNo');
    });

    it('should handle invalid JSON in sessionStorage gracefully', () => {
      spyOn(sessionStorage, 'getItem').and.returnValue('invalid json');
      spyOn(console, 'error');
      arrivalService.getArrivalShipments.and.returnValue(of({ shipments: [], totalRecords: 0, pageNumber: 0, pageSize: 10 }));

      component.ngOnInit();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to parse shipment data from sessionStorage:',
        jasmine.any(SyntaxError)
      );
    });

    it('should load shipment from API when sessionStorage is empty', () => {
      spyOn(sessionStorage, 'getItem').and.returnValue(null);
      spyOn(component, 'loadShipmentDetails');

      component.ngOnInit();

      expect(component.loadShipmentDetails).toHaveBeenCalled();
    });
  });

  describe('loadShipmentDetails', () => {
    it('should load and populate shipment from API', () => {
      const mockResponse = {
        shipments: [mockShipment],
        totalRecords: 1,
        pageNumber: 0,
        pageSize: 10
      };
      arrivalService.getArrivalShipments.and.returnValue(of(mockResponse));
      spyOn(component, 'populateFormFromShipment');

      component.loadShipmentDetails('SHIP001');

      expect(arrivalService.getArrivalShipments).toHaveBeenCalled();
      expect(component.populateFormFromShipment).toHaveBeenCalledWith(mockShipment);
    });

    it('should handle shipment not found', () => {
      const mockResponse = {
        shipments: [],
        totalRecords: 0,
        pageNumber: 0,
        pageSize: 10
      };
      arrivalService.getArrivalShipments.and.returnValue(of(mockResponse));
      spyOn(console, 'warn');

      component.loadShipmentDetails('NONEXISTENT');

      expect(console.warn).toHaveBeenCalledWith('Shipment not found:', 'NONEXISTENT');
    });

    it('should handle API error', () => {
      arrivalService.getArrivalShipments.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      spyOn(console, 'error');

      component.loadShipmentDetails('SHIP001');

      expect(console.error).toHaveBeenCalledWith(
        'Error loading shipment details:',
        jasmine.any(Error)
      );
    });
  });

  describe('populateFormFromShipment', () => {
    it('should populate all form fields from shipment', () => {
      component.populateFormFromShipment(mockShipment);

      expect(component.shipmentNo).toBe('SHIP001');
      expect(component.poNo).toBe('PO001');
      expect(component.customerName).toBe('Customer A');
      expect(component.sourceSystem).toBe('SAP');
      expect(component.bdpRepresentativeName).toBe('John Doe');
      expect(component.modeOfTransport).toBe('OCEAN');
      expect(component.moveTypeDescription).toBe('Import');
      expect(component.carrierName).toBe('Maersk');
      expect(component.hbl).toBe('HBL123');
      expect(component.portOfDeparture).toBe('Mumbai, India');
      expect(component.portOfTransit).toBe('Singapore');
      expect(component.portOfArrival).toBe('Houston, USA');
    });

    it('should parse date fields correctly', () => {
      component.populateFormFromShipment(mockShipment);

      expect(component.atd).toBeInstanceOf(Date);
      expect(component.eta).toBeInstanceOf(Date);
      expect(component.predictiveETA).toBeInstanceOf(Date);
      expect(component.latestEta).toBeInstanceOf(Date);
      expect(component.ata).toBeNull();
    });

    it('should handle empty/null shipment fields', () => {
      const emptyShipment = { shipmentNo: 'SHIP002' } as Shipment;

      component.populateFormFromShipment(emptyShipment);

      expect(component.shipmentNo).toBe('SHIP002');
      expect(component.poNo).toBe('');
      expect(component.customerName).toBe('');
      expect(component.modeOfTransport).toBe('OCEAN'); // default
    });

    it('should normalize transport mode', () => {
      const shipment = { ...mockShipment, modeOfTransport: 'sea transport' };

      component.populateFormFromShipment(shipment);

      expect(component.modeOfTransport).toBe('OCEAN');
    });
  });

  describe('normalizeTransportMode', () => {
    it('should normalize OCEAN variants', () => {
      expect(component.normalizeTransportMode('ocean')).toBe('OCEAN');
      expect(component.normalizeTransportMode('SEA')).toBe('OCEAN');
      expect(component.normalizeTransportMode('Ocean Transport')).toBe('OCEAN');
    });

    it('should normalize AIR variants', () => {
      expect(component.normalizeTransportMode('air')).toBe('AIR');
      expect(component.normalizeTransportMode('AIR FREIGHT')).toBe('AIR');
    });

    it('should normalize RAIL variants', () => {
      expect(component.normalizeTransportMode('rail')).toBe('RAIL');
      expect(component.normalizeTransportMode('RAIL TRANSPORT')).toBe('RAIL');
    });

    it('should normalize TRUCK variants', () => {
      expect(component.normalizeTransportMode('truck')).toBe('TRUCK');
      expect(component.normalizeTransportMode('ROAD')).toBe('TRUCK');
    });

    it('should return original value for unknown modes', () => {
      expect(component.normalizeTransportMode('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('parseDate', () => {
    it('should parse valid date string', () => {
      const result = component.parseDate('2025-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toContain('2025-01-15');
    });

    it('should return null for null input', () => {
      expect(component.parseDate(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(component.parseDate(undefined)).toBeNull();
    });

    it('should return null for invalid date string', () => {
      expect(component.parseDate('invalid-date')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(component.parseDate('')).toBeNull();
    });
  });

  describe('setActiveTab', () => {
    it('should set active tab', () => {
      component.setActiveTab('shipment-details');
      expect(component.activeTab).toBe('shipment-details');

      component.setActiveTab('documents');
      expect(component.activeTab).toBe('documents');
    });
  });

  describe('onCancel', () => {
    it('should navigate to arrival page', () => {
      component.onCancel();

      expect(routerNavigateSpy).toHaveBeenCalledWith(['/arrival']);
    });
  });

  describe('onSave', () => {
    it('should log save action and navigate to arrival page', () => {
      spyOn(console, 'log');

      component.onSave();

      expect(console.log).toHaveBeenCalledWith('Saving shipment configuration...');
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/arrival']);
    });
  });
});
