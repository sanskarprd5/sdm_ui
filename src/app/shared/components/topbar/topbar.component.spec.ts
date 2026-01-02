import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ElementRef } from '@angular/core';
import { of, throwError } from 'rxjs';

import { TopbarComponent } from './topbar.component';
import { AuthService } from '../../../auth/auth.service';
import { AlertsService, AlertDto } from '../../../pages/alerts/alerts/alerts.service';

describe('TopbarComponent', () => {
  let component: TopbarComponent;
  let fixture: ComponentFixture<TopbarComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let alertsService: jasmine.SpyObj<AlertsService>;
  let router: jasmine.SpyObj<Router>;

  const mockAlerts: AlertDto[] = [
    {
      id: 1,
      name: 'Alert 1',
      module: 'ARRIVAL',
      notificationEnabled: true,
      emailEnabled: false,
      emailTo: [],
      thresholdDays: 5,
      hazardousGoods: false,
      companyName: '',
      carrier: '',
      portOfDeparture: '',
      portOfArrival: '',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      lastTriggeredDate: '2025-01-10',
      shipments: ['SHIP001', 'SHIP002'],
      status: 'ACTIVE',
      alertType: 1,
      triggerType: 'Realtime',
      enabled: true
    },
    {
      id: 2,
      name: 'Alert 2',
      module: 'ARRIVAL',
      notificationEnabled: true,
      emailEnabled: true,
      emailTo: ['test@example.com'],
      thresholdDays: 7,
      hazardousGoods: true,
      companyName: 'Company A',
      carrier: 'Carrier B',
      portOfDeparture: 'Port X',
      portOfArrival: 'Port Y',
      startDate: '2025-02-01',
      endDate: '2025-11-30',
      lastTriggeredDate: null,
      shipments: ['SHIP003'],
      status: 'ACTIVE',
      alertType: 1,
      triggerType: 'Daily',
      enabled: true
    },
    {
      id: 3,
      name: 'Alert 3',
      module: 'DEPARTURE',
      notificationEnabled: false,
      emailEnabled: true,
      emailTo: ['ignored@example.com'],
      thresholdDays: 10,
      hazardousGoods: false,
      companyName: '',
      carrier: '',
      portOfDeparture: '',
      portOfArrival: '',
      startDate: '2025-03-01',
      endDate: '2025-10-31',
      lastTriggeredDate: null,
      shipments: [],
      status: 'INACTIVE',
      alertType: 1,
      triggerType: 'Realtime',
      enabled: false
    }
  ];

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserData', 'logout']);
    const alertsServiceSpy = jasmine.createSpyObj('AlertsService', ['getNotificationEnabledAlerts']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TopbarComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AlertsService, useValue: alertsServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    alertsService = TestBed.inject(AlertsService) as jasmine.SpyObj<AlertsService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize with JWT user data', () => {
      authService.getUserData.and.returnValue({ username: 'johndoe', email: 'john@test.com' });
      alertsService.getNotificationEnabledAlerts.and.returnValue(of([]));

      component.ngOnInit();

      expect(component.username).toBe('johndoe');
      expect(component.userInitials).toBe('JO');
      expect(component.userMenuItems.length).toBe(1);
    });

    it('should use fallback values when no user data available', () => {
      authService.getUserData.and.returnValue(null);
      alertsService.getNotificationEnabledAlerts.and.returnValue(of([]));

      component.ngOnInit();

      expect(component.username).toBe('User');
      expect(component.userInitials).toBe('SU');
    });

    it('should call loadNotificationAlerts on init', () => {
      authService.getUserData.and.returnValue({ username: 'testuser' });
      alertsService.getNotificationEnabledAlerts.and.returnValue(of([]));
      spyOn(component, 'loadNotificationAlerts');

      component.ngOnInit();

      expect(component.loadNotificationAlerts).toHaveBeenCalled();
    });
  });

  describe('loadNotificationAlerts', () => {
    beforeEach(() => {
      authService.getUserData.and.returnValue({ username: 'testuser' });
    });

    it('should load notification-enabled alerts successfully', () => {
      alertsService.getNotificationEnabledAlerts.and.returnValue(of(mockAlerts));

      component.loadNotificationAlerts();

      expect(component.shipmentAlerts.length).toBe(2);
      expect(component.unreadCount).toBe(2);
      expect(component.shipmentAlerts[0].name).toBe('Alert 1');
      expect(component.shipmentAlerts[1].shipmentNumbers).toEqual(['SHIP003']);
    });

    it('should filter out alerts with notificationEnabled = false', () => {
      alertsService.getNotificationEnabledAlerts.and.returnValue(of(mockAlerts));

      component.loadNotificationAlerts();

      const hasInactiveAlert = component.shipmentAlerts.some(alert => alert.name === 'Alert 3');
      expect(hasInactiveAlert).toBe(false);
    });

    it('should map alert fields correctly to ShipmentAlert', () => {
      alertsService.getNotificationEnabledAlerts.and.returnValue(of([mockAlerts[0]]));

      component.loadNotificationAlerts();

      const alert = component.shipmentAlerts[0];
      expect(alert.id).toBe(1);
      expect(alert.name).toBe('Alert 1');
      expect(alert.lastTriggeredDate).toBe('2025-01-10');
      expect(alert.shipmentNumbers).toEqual(['SHIP001', 'SHIP002']);
      expect(alert.module).toBe('ARRIVAL');
      expect(alert.status).toBe('ACTIVE');
    });

    it('should handle error when loading alerts fails', () => {
      alertsService.getNotificationEnabledAlerts.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      spyOn(console, 'error');

      component.loadNotificationAlerts();

      expect(component.shipmentAlerts).toEqual([]);
      expect(component.unreadCount).toBe(0);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load notification alerts:',
        jasmine.any(Error)
      );
    });

    it('should handle empty alerts array', () => {
      alertsService.getNotificationEnabledAlerts.and.returnValue(of([]));

      component.loadNotificationAlerts();

      expect(component.shipmentAlerts).toEqual([]);
      expect(component.unreadCount).toBe(0);
    });
  });

  describe('toggleAlertsPanel', () => {
    it('should open alerts panel when closed', () => {
      const event = new Event('click');
      spyOn(event, 'stopPropagation');
      component.alertsPanelVisible = false;

      component.toggleAlertsPanel(event);

      expect(component.alertsPanelVisible).toBe(true);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should close alerts panel when open', () => {
      const event = new Event('click');
      spyOn(event, 'stopPropagation');
      component.alertsPanelVisible = true;

      component.toggleAlertsPanel(event);

      expect(component.alertsPanelVisible).toBe(false);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should reset unread count when opening panel with unread alerts', () => {
      const event = new Event('click');
      component.alertsPanelVisible = false;
      component.unreadCount = 5;

      component.toggleAlertsPanel(event);

      expect(component.unreadCount).toBe(0);
      expect(component.alertsPanelVisible).toBe(true);
    });

    it('should not reset unread count when closing panel', () => {
      const event = new Event('click');
      component.alertsPanelVisible = true;
      component.unreadCount = 5;

      component.toggleAlertsPanel(event);

      expect(component.unreadCount).toBe(5);
      expect(component.alertsPanelVisible).toBe(false);
    });
  });

  describe('toggleMenu', () => {
    it('should toggle PrimeNG menu when menu exists', () => {
      const mockMenu = jasmine.createSpyObj('Menu', ['toggle']);
      component.menu = mockMenu;
      const event = new Event('click');

      component.toggleMenu(event);

      expect(mockMenu.toggle).toHaveBeenCalledWith(event);
    });

    it('should not throw error when menu is undefined', () => {
      component.menu = undefined as any;
      const event = new Event('click');

      expect(() => component.toggleMenu(event)).not.toThrow();
    });
  });

  describe('onDocumentClick', () => {
    it('should close alerts panel when clicking outside', () => {
      component.alertsPanelVisible = true;
      const outsideElement = document.createElement('div');
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: outsideElement });

      component.onDocumentClick(event);

      expect(component.alertsPanelVisible).toBe(false);
    });

    it('should not close alerts panel when clicking inside', () => {
      component.alertsPanelVisible = true;
      const insideElement = fixture.nativeElement.querySelector('div') || fixture.nativeElement;
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: insideElement });

      component.onDocumentClick(event);

      expect(component.alertsPanelVisible).toBe(true);
    });

    it('should do nothing when panel is already closed', () => {
      component.alertsPanelVisible = false;
      const outsideElement = document.createElement('div');
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: outsideElement });

      component.onDocumentClick(event);

      expect(component.alertsPanelVisible).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call authService.logout on successful logout', () => {
      authService.logout.and.returnValue(of(void 0));

      component.logout();

      expect(authService.logout).toHaveBeenCalled();
    });

    it('should handle logout error gracefully', () => {
      authService.logout.and.returnValue(throwError(() => new Error('Logout failed')));
      spyOn(console, 'error');

      component.logout();

      expect(console.error).toHaveBeenCalledWith('Logout error:', jasmine.any(Error));
    });
  });
});
