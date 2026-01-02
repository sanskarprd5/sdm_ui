import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AlertsComponent } from './alerts.component';
import { AlertDto, AlertsService } from './alerts.service';

describe('AlertsComponent', () => {
  let component: AlertsComponent;
  let fixture: ComponentFixture<AlertsComponent>;
  let alertsService: jasmine.SpyObj<AlertsService>;

  const mockAlertDto: AlertDto = {
    id: 1,
    name: 'Test Alert',
    module: 'ARRIVAL',
    alertType: 2,
    triggerType: 'DELAY',
    thresholdDays: 5,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    emailTo: ['test@example.com'],
    shipments: ['SHIP001', 'SHIP002'],
    enabled: true,
    lastTriggeredDate: '2025-12-01',
    companyName: 'Test Company',
    portOfDeparture: 'Port A',
    portOfArrival: 'Port B',
    carrier: 'Test Carrier',
    hazardousGoods: false,
    emailEnabled: true,
    notificationEnabled: true,
    status: 'Active'
  };

  beforeEach(async () => {
    const alertsServiceSpy = jasmine.createSpyObj('AlertsService', ['getAlerts', 'createAlert', 'updateAlert']);

    await TestBed.configureTestingModule({
      imports: [AlertsComponent, HttpClientTestingModule],
      providers: [
        { provide: AlertsService, useValue: alertsServiceSpy },
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertsComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService) as jasmine.SpyObj<AlertsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call loadAlerts on initialization', () => {
      spyOn(component, 'loadAlerts');
      component.ngOnInit();
      expect(component.loadAlerts).toHaveBeenCalled();
    });
  });

  describe('loadAlerts', () => {
    it('should load alerts successfully', () => {
      const mockAlerts = [mockAlertDto];
      alertsService.getAlerts.and.returnValue(of(mockAlerts));

      component.loadAlerts();

      expect(component.isLoading).toBe(false);
      expect(component.shipmentsData.length).toBe(1);
      expect(component.filteredShipments.length).toBe(1);
      expect(component.dialogShipmentsSource.length).toBe(1);
      expect(component.loadError).toBeNull();
    });

    it('should handle error when loading alerts fails', () => {
      alertsService.getAlerts.and.returnValue(throwError(() => new Error('API Error')));

      component.loadAlerts();

      expect(component.isLoading).toBe(false);
      expect(component.shipmentsData.length).toBe(0);
      expect(component.filteredShipments.length).toBe(0);
      expect(component.loadError).toBe('Unable to load alerts. Please try again.');
    });

    it('should set isLoading to true initially', () => {
      alertsService.getAlerts.and.returnValue(of([]));
      component.loadAlerts();
      expect(alertsService.getAlerts).toHaveBeenCalled();
    });
  });

  describe('mapAlertToRow', () => {
    it('should map alert to shipment row correctly', () => {
      const result = component['mapAlertToRow'](mockAlertDto);

      expect(result.id).toBe(1);
      expect(result.alertName).toBe('Test Alert');
      expect(result.company).toBe('Test Company');
      expect(result.carrier).toBe('Test Carrier');
      expect(result.portOfDeparture).toBe('Port A');
      expect(result.portOfArrival).toBe('Port B');
      expect(result.hazardousGoods).toBe('No');
    });

    it('should handle hazardousGoods true', () => {
      const alert = { ...mockAlertDto, hazardousGoods: true };
      const result = component['mapAlertToRow'](alert);
      expect(result.hazardousGoods).toBe('Yes');
    });

    it('should handle empty shipments array', () => {
      const alert = { ...mockAlertDto, shipments: [] };
      const result = component['mapAlertToRow'](alert);
      expect(result.shipmentNo).toBe('--');
      expect(result.shipmentsList).toEqual([]);
    });

    it('should join multiple shipments with comma', () => {
      const result = component['mapAlertToRow'](mockAlertDto);
      expect(result.shipmentNo).toBe('SHIP001, SHIP002');
    });
  });

  describe('onEditRow', () => {
    it('should populate dialog config when editing a row', () => {
      const row: any = {
        id: 1,
        shipmentNo: 'SHIP001',
        alertName: 'Test Alert',
        email: 'Yes',
        emailRecipients: ['test@example.com'],
        notification: 'Yes',
        thresholdDays: 5,
        hazardousGoods: 'Yes',
        trigger: 'Realtime',
        company: 'Test Company',
        carrier: 'Test Carrier',
        portOfDeparture: 'Port A',
        portOfArrival: 'Port B',
        startDate: '01 Jan 2025',
        endDate: '31 Dec 2025',
        shipmentsList: ['SHIP001']
      };

      component.onEditRow(row);

      expect(component.editingAlertId).toBe(1);
      expect(component.dialogInitialConfig).toBeDefined();
      expect(component.dialogInitialConfig?.alertName).toBe('Test Alert');
      expect(component.showAlertConfigDialog).toBe(true);
    });

    it('should return early if row does not have shipmentNo', () => {
      const row: any = { id: 1 };
      component.onEditRow(row);
      expect(component.editingAlertId).toBeNull();
    });
  });

  describe('addAlert', () => {
    it('should clear editing state and show dialog', () => {
      component.editingAlertId = 5;
      component.addAlert();

      expect(component.editingAlertId).toBeNull();
      expect(component.dialogInitialConfig).toBeNull();
      expect(component.showAlertConfigDialog).toBe(true);
    });
  });

  describe('onAlertConfigSave', () => {
    const mockConfig = {
      alertName: 'New Alert',
      email: 'test@example.com',
      emailChecked: true,
      notification: false,
      shipmentNos: ['SHIP001'],
      thresholdDays: 7,
      hazardousGoods: true,
      trigger: 'Realtime',
      companyName: 'Company A',
      carrier: 'Carrier B',
      portOfDeparture: 'Port X',
      portOfArrival: 'Port Y',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31')
    };

    it('should create a new alert when editingAlertId is null', () => {
      component.editingAlertId = null;
      alertsService.createAlert.and.returnValue(of(mockAlertDto));
      spyOn(component, 'loadAlerts');

      component.onAlertConfigSave(mockConfig);

      expect(alertsService.createAlert).toHaveBeenCalled();
      expect(component.loadAlerts).toHaveBeenCalled();
      expect(component.showAlertConfigDialog).toBe(false);
      expect(component.editingAlertId).toBeNull();
    });

    it('should update alert when editingAlertId is set', () => {
      component.editingAlertId = 1;
      alertsService.updateAlert.and.returnValue(of(mockAlertDto));
      spyOn(component, 'loadAlerts');

      component.onAlertConfigSave(mockConfig);

      expect(alertsService.updateAlert).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(component.loadAlerts).toHaveBeenCalled();
      expect(component.showAlertConfigDialog).toBe(false);
    });

    it('should handle create alert error', () => {
      component.editingAlertId = null;
      alertsService.createAlert.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(window, 'alert');

      component.onAlertConfigSave(mockConfig);

      expect(window.alert).toHaveBeenCalledWith('Failed to create alert. Please try again.');
    });

    it('should handle update alert error', () => {
      component.editingAlertId = 1;
      alertsService.updateAlert.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(window, 'alert');

      component.onAlertConfigSave(mockConfig);

      expect(window.alert).toHaveBeenCalledWith('Failed to update alert. Please try again.');
    });
  });

  describe('onAlertConfigCancel', () => {
    it('should close dialog and reset state', () => {
      component.showAlertConfigDialog = true;
      component.editingAlertId = 5;
      component.dialogInitialConfig = { alertName: 'Test' };

      component.onAlertConfigCancel();

      expect(component.showAlertConfigDialog).toBe(false);
      expect(component.dialogInitialConfig).toBeNull();
      expect(component.editingAlertId).toBeNull();
    });
  });

  describe('formatDateForApi', () => {
    it('should format valid date correctly', () => {
      const date = new Date('2025-12-01');
      const result = component['formatDateForApi'](date);
      expect(result).toBe('2025-12-01');
    });

    it('should return current date for null input', () => {
      const result = component['formatDateForApi'](null);
      const today = new Date().toISOString().split('T')[0];
      expect(result).toBe(today);
    });

    it('should return current date for undefined input', () => {
      const result = component['formatDateForApi'](undefined);
      const today = new Date().toISOString().split('T')[0];
      expect(result).toBe(today);
    });
  });

  describe('setActiveTab', () => {
    it('should change active tab and reset search', () => {
      component.searchTerm = 'test';
      component.setActiveTab('eta');

      expect(component.activeTabId).toBe('eta');
      expect(component.searchTerm).toBe('');
    });

    it('should not change tab if same tab is selected', () => {
      component.activeTabId = 'shipments';
      spyOn(component, 'applySearch');
      
      component.setActiveTab('shipments');

      expect(component.applySearch).not.toHaveBeenCalled();
    });
  });

  describe('onSearch', () => {
    it('should call applySearch', () => {
      spyOn(component, 'applySearch');
      component.onSearch();
      expect(component.applySearch).toHaveBeenCalled();
    });
  });

  describe('applySearch', () => {
    beforeEach(() => {
      component.shipmentsData = [{
        id: 1,
        shipmentNo: 'SHIP001',
        status: 'Late',
        alertName: 'Test Alert',
        email: 'Yes',
        emailRecipients: ['test@example.com'],
        notification: 'Yes',
        thresholdDays: 5,
        hazardousGoods: 'No',
        trigger: 'Realtime',
        company: 'Company A',
        carrier: 'Carrier B',
        portOfDeparture: 'Port X',
        portOfArrival: 'Port Y',
        startDate: '01 Jan 2025',
        endDate: '31 Dec 2025',
        shipmentsList: ['SHIP001']
      }];

      component.etaData = [{
        trigger: 'Realtime',
        company: 'Company A',
        carrier: 'Carrier B',
        portOfDeparture: 'Port X',
        portOfArrival: 'Port Y',
        startDate: 'Start',
        endDate: 'End'
      }];
    });

    it('should filter shipments based on search term', () => {
      component.searchTerm = 'SHIP001';
      component.applySearch();
      expect(component.filteredShipments.length).toBe(1);
    });

    it('should show all shipments when search term is empty', () => {
      component.searchTerm = '';
      component.applySearch();
      expect(component.filteredShipments.length).toBe(1);
    });

    it('should return empty array when no matches found', () => {
      component.searchTerm = 'NONEXISTENT';
      component.applySearch();
      expect(component.filteredShipments.length).toBe(0);
      expect(component.filteredEta.length).toBe(0);
    });

    it('should filter ETA data along with shipments', () => {
      component.searchTerm = 'Realtime';
      component.applySearch();
      expect(component.filteredEta.length).toBe(1);
    });
  });

  describe('refresh', () => {
    it('should clear search and reload alerts', () => {
      spyOn(component, 'loadAlerts');
      component.searchTerm = 'test';

      component.refresh();

      expect(component.searchTerm).toBe('');
      expect(component.loadAlerts).toHaveBeenCalled();
    });
  });

  describe('table helpers', () => {
    it('should expose shipments columns and data by default', () => {
      component.filteredShipments = [{ id: 1 } as any];
      expect(component.tableColumns).toBe(component.shipmentsColumns);
      expect(component.tableData).toBe(component.filteredShipments);
    });

    it('should expose ETA columns and data when eta tab active', () => {
      component.activeTabId = 'eta';
      component.filteredEta = [{
        trigger: 'Realtime',
        company: 'Test',
        carrier: 'Carrier',
        portOfDeparture: 'Port X',
        portOfArrival: 'Port Y',
        startDate: 'Start',
        endDate: 'End'
      }];
      expect(component.tableColumns).toBe(component.etaColumns);
      expect(component.tableData).toBe(component.filteredEta);
    });
  });

  describe('formatting helpers', () => {
    it('should derive status labels', () => {
      expect(component['deriveStatus'](1)).toBe('Early');
      expect(component['deriveStatus'](2)).toBe('Late');
    });

    it('should format dates with fallbacks', () => {
      expect(component['formatDate']('2025-01-01')).toContain('2025');
      expect(component['formatDate'](null)).toBe('--');
      expect(component['formatDate']('not-a-date')).toBe('not-a-date');
    });

    it('should map statuses to css classes', () => {
      expect(component.getStatusClass('Late')).toBe('status-late');
      expect(component.getStatusClass('Early')).toBe('status-early');
    });

    it('should parse dates and fallback to undefined', () => {
      expect(component['toDate']('Jan 01 2025')).toEqual(jasmine.any(Date));
      expect(component['toDate']('not-a-date')).toBeUndefined();
    });
  });
});
