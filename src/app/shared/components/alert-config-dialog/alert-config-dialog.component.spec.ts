import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';

import { AlertConfigDialogComponent, AlertConfig } from './alert-config-dialog.component';

describe('AlertConfigDialogComponent', () => {
  let component: AlertConfigDialogComponent;
  let fixture: ComponentFixture<AlertConfigDialogComponent>;

  const mockShipment1 = {
    shipmentId: 1,
    shipmentNo: 'SHIP001',
    poNo: 'PO001'
  };

  const mockShipment2 = {
    shipmentId: 2,
    shipmentNo: 'SHIP002',
    poNo: 'PO002'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertConfigDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertConfigDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should reset form and initialize static shipment options', () => {
      spyOn<any>(component, 'resetForm');
      spyOn<any>(component, 'initializeStaticShipmentOptions');

      component.ngOnInit();

      expect(component['resetForm']).toHaveBeenCalled();
      expect(component['initializeStaticShipmentOptions']).toHaveBeenCalled();
    });

    it('should populate shipmentOptions with static values', () => {
      component.ngOnInit();

      expect(component.shipmentOptions.length).toBeGreaterThan(0);
      expect(component.shipmentOptions[0]).toEqual(
        jasmine.objectContaining({ label: jasmine.any(String), value: jasmine.any(String) })
      );
    });
  });

  describe('ngOnChanges', () => {
    it('should update shipment options when selectedShipments changes', () => {
      spyOn<any>(component, 'updateShipmentOptions');

      component.ngOnChanges({
        selectedShipments: new SimpleChange(null, [mockShipment1], false)
      });

      expect(component['updateShipmentOptions']).toHaveBeenCalled();
    });

    it('should update shipmentNosText when useTextFieldForShipments is true', () => {
      component.useTextFieldForShipments = true;
      component.selectedShipments = [mockShipment1, mockShipment2];

      component.ngOnChanges({
        selectedShipments: new SimpleChange(null, [mockShipment1, mockShipment2], false)
      });

      expect(component.shipmentNosText).toBe('SHIP001, SHIP002');
    });

    it('should apply initial config when provided', () => {
      const mockConfig: Partial<AlertConfig> = {
        alertName: 'Test Alert',
        email: 'test@example.com',
        emailChecked: true,
        thresholdDays: 5
      };
      spyOn<any>(component, 'applyInitialConfig');
      component.initialConfig = mockConfig;

      component.ngOnChanges({
        initialConfig: new SimpleChange(null, mockConfig, false)
      });

      expect(component['applyInitialConfig']).toHaveBeenCalledWith(mockConfig);
    });

    it('should reset form when initialConfig is null', () => {
      component.ngOnInit(); // Initialize shipmentOptions
      spyOn<any>(component, 'resetForm');

      component.ngOnChanges({
        initialConfig: new SimpleChange({}, null, false)
      });

      expect(component['resetForm']).toHaveBeenCalled();
    });
  });

  describe('updateShipmentOptions', () => {
    beforeEach(() => {
      component.ngOnInit(); // Initialize static shipments
    });

    it('should include static shipment numbers in options', () => {
      component['updateShipmentOptions']();

      const staticShipmentNo = component['staticShipmentNumbers'][0];
      const found = component.shipmentOptions.some(opt => opt.value === staticShipmentNo);
      expect(found).toBe(true);
    });

    it('should merge dynamic shipments with static ones', () => {
      component.selectedShipments = [{ shipmentNo: 'DYNAMIC001' }];

      component['updateShipmentOptions']();

      const hasDynamic = component.shipmentOptions.some(opt => opt.value === 'DYNAMIC001');
      expect(hasDynamic).toBe(true);
    });

    it('should auto-select all shipments when autoSelectShipments is true', () => {
      component.autoSelectShipments = true;
      component.shipmentNos = [];

      component['updateShipmentOptions']();

      expect(component.shipmentNos.length).toBeGreaterThan(0);
    });

    it('should not auto-select when initialConfig has shipmentNos', () => {
      component.autoSelectShipments = true;
      component.initialConfig = { shipmentNos: ['SHIP001'] };
      component.shipmentNos = [];

      component['updateShipmentOptions']();

      expect(component.shipmentNos.length).toBe(0);
    });

    it('should handle pending shipment selections', () => {
      component['pendingShipmentSelections'] = ['996314', 'KBUSI0095525'];
      component['updateShipmentOptions']();

      expect(component.shipmentNos.length).toBe(2);
      expect(component['pendingShipmentSelections']).toBeNull();
    });
  });

  describe('resetForm', () => {
    it('should reset all form fields to default values', () => {
      component.emailChecked = true;
      component.notificationChecked = true;
      component.email = 'test@test.com';
      component.alertName = 'Alert';
      component.thresholdDays = 10;
      component.hazardousGoods = 'no';
      component.shipmentNos = [{ label: 'SHIP001', value: 'SHIP001' }];

      component['resetForm']();

      expect(component.emailChecked).toBe(false);
      expect(component.notificationChecked).toBe(false);
      expect(component.email).toBe('');
      expect(component.alertName).toBe('');
      expect(component.thresholdDays).toBe(0);
      expect(component.hazardousGoods).toBe('yes');
      expect(component.shipmentNos).toEqual([]);
      expect(component.startDate).toBeInstanceOf(Date);
      expect(component.endDate).toEqual(new Date('2025-05-02'));
    });
  });

  describe('applyInitialConfig', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should apply all config fields correctly', () => {
      const config: Partial<AlertConfig> = {
        alertName: 'Test Alert',
        email: 'test@example.com',
        emailChecked: true,
        notification: true,
        thresholdDays: 7,
        hazardousGoods: true,
        trigger: 'Daily',
        companyName: 'Company A',
        carrier: 'Carrier B',
        portOfDeparture: 'Port X',
        portOfArrival: 'Port Y',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      };

      component['applyInitialConfig'](config);

      expect(component.alertName).toBe('Test Alert');
      expect(component.email).toBe('test@example.com');
      expect(component.emailChecked).toBe(true);
      expect(component.notificationChecked).toBe(true);
      expect(component.thresholdDays).toBe(7);
      expect(component.hazardousGoods).toBe('yes');
      expect(component.trigger).toBe('Daily');
      expect(component.companyName).toBe('Company A');
      expect(component.carrier).toBe('Carrier B');
      expect(component.portOfDeparture).toBe('Port X');
      expect(component.portOfArrival).toBe('Port Y');
      expect(component.startDate).toEqual(new Date('2025-01-01'));
      expect(component.endDate).toEqual(new Date('2025-12-31'));
    });

    it('should set hazardousGoods to "no" when false', () => {
      const config: Partial<AlertConfig> = { hazardousGoods: false };

      component['applyInitialConfig'](config);

      expect(component.hazardousGoods).toBe('no');
    });

    it('should handle shipmentNos with populated options', () => {
      const config: Partial<AlertConfig> = {
        shipmentNos: ['996314', 'KBUSI0095525']
      };

      component['applyInitialConfig'](config);

      expect(component.shipmentNos.length).toBe(2);
    });

    it('should defer shipmentNos when options not yet loaded', () => {
      component.shipmentOptions = [];
      const config: Partial<AlertConfig> = {
        shipmentNos: ['SHIP001', 'SHIP002']
      };

      component['applyInitialConfig'](config);

      expect(component['pendingShipmentSelections']).toEqual(['SHIP001', 'SHIP002']);
    });
  });

  describe('onHide', () => {
    it('should emit visibleChange with false', () => {
      spyOn(component.visibleChange, 'emit');

      component.onHide();

      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    });
  });

  describe('onCancel', () => {
    it('should emit cancel event and hide dialog', () => {
      spyOn(component.cancel, 'emit');
      spyOn(component, 'onHide');

      component.onCancel();

      expect(component.cancel.emit).toHaveBeenCalled();
      expect(component.onHide).toHaveBeenCalled();
    });
  });

  describe('onSave', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should emit config with dropdown mode shipment numbers', () => {
      component.useTextFieldForShipments = false;
      component.shipmentNos = [
        { label: 'SHIP001', value: 'SHIP001' },
        { label: 'SHIP002', value: 'SHIP002' }
      ];
      component.alertName = 'Alert 1';
      component.email = 'test@test.com';
      component.emailChecked = true;
      component.notificationChecked = false;
      component.thresholdDays = 5;
      component.hazardousGoods = 'yes';

      spyOn(component.save, 'emit');
      spyOn(component, 'onHide');

      component.onSave();

      expect(component.save.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          shipmentNos: ['SHIP001', 'SHIP002'],
          alertName: 'Alert 1',
          email: 'test@test.com',
          emailChecked: true,
          notification: false,
          thresholdDays: 5,
          hazardousGoods: true
        })
      );
      expect(component.onHide).toHaveBeenCalled();
    });

    it('should emit config with text field mode shipment numbers', () => {
      component.useTextFieldForShipments = true;
      component.shipmentNosText = 'SHIP001, SHIP002, SHIP003';
      component.alertName = 'Alert 2';

      spyOn(component.save, 'emit');

      component.onSave();

      const emittedConfig = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0] as AlertConfig;
      expect(emittedConfig.shipmentNos).toEqual(['SHIP001', 'SHIP002', 'SHIP003']);
      expect(emittedConfig.alertName).toBe('Alert 2');
    });

    it('should handle empty shipment numbers in text mode', () => {
      component.useTextFieldForShipments = true;
      component.shipmentNosText = '';

      spyOn(component.save, 'emit');

      component.onSave();

      const emittedConfig = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0] as AlertConfig;
      expect(emittedConfig.shipmentNos).toEqual([]);
    });

    it('should convert hazardousGoods string to boolean', () => {
      component.hazardousGoods = 'no';

      spyOn(component.save, 'emit');

      component.onSave();

      const emittedConfig = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0] as AlertConfig;
      expect(emittedConfig.hazardousGoods).toBe(false);
    });
  });
});
