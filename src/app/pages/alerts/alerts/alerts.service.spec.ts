import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AlertsService, AlertDto, CreateAlertRequest, UpdateAlertRequest } from './alerts.service';

const BASE_URL = 'http://192.168.0.43:8080/smart-sdm-api/api/v1';
const SAMPLE_ALERT: AlertDto = {
  id: 1,
  name: 'Port Delay',
  module: 'ARRIVAL',
  alertType: 2,
  triggerType: 'Realtime',
  thresholdDays: 3,
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  emailTo: ['alerts@example.com'],
  shipments: ['SHIP001'],
  enabled: true,
  lastTriggeredDate: '2025-02-10',
  companyName: 'BDP',
  portOfDeparture: 'NYC',
  portOfArrival: 'DXB',
  carrier: 'Maersk',
  hazardousGoods: false,
  emailEnabled: true,
  notificationEnabled: false,
  status: 'ACTIVE'
};

describe('AlertsService', () => {
  let service: AlertsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(AlertsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request alerts with default pagination params', () => {
    let response: AlertDto[] | undefined;

    service.getAlerts().subscribe((alerts) => (response = alerts));

    const req = httpMock.expectOne((request) => request.url === `${BASE_URL}/alerts`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush([SAMPLE_ALERT]);

    expect(response).toEqual([SAMPLE_ALERT]);
  });

  it('should request alerts with provided pagination params', () => {
    service.getAlerts(2, 50).subscribe();

    const req = httpMock.expectOne((request) => request.url === `${BASE_URL}/alerts`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('50');
    req.flush([]);
  });

  it('should create alert with POST payload', () => {
    const payload: CreateAlertRequest = {
      name: SAMPLE_ALERT.name,
      module: SAMPLE_ALERT.module,
      alertType: SAMPLE_ALERT.alertType,
      triggerType: SAMPLE_ALERT.triggerType,
      thresholdDays: SAMPLE_ALERT.thresholdDays,
      startDate: SAMPLE_ALERT.startDate,
      endDate: SAMPLE_ALERT.endDate,
      emailTo: SAMPLE_ALERT.emailTo,
      shipments: SAMPLE_ALERT.shipments,
      enabled: SAMPLE_ALERT.enabled,
      emailEnabled: SAMPLE_ALERT.emailEnabled ?? true,
      notificationEnabled: SAMPLE_ALERT.notificationEnabled ?? false,
      companyName: SAMPLE_ALERT.companyName,
      portOfDeparture: SAMPLE_ALERT.portOfDeparture,
      portOfArrival: SAMPLE_ALERT.portOfArrival,
      carrier: SAMPLE_ALERT.carrier,
      hazardousGoods: SAMPLE_ALERT.hazardousGoods
    };

    let response: AlertDto | undefined;

    service.createAlert(payload).subscribe((alert) => (response = alert));

    const req = httpMock.expectOne(`${BASE_URL}/alerts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(SAMPLE_ALERT);

    expect(response).toEqual(SAMPLE_ALERT);
  });

  it('should update the alert by id', () => {
    const payload: UpdateAlertRequest = {
      name: `${SAMPLE_ALERT.name} Updated`,
      module: SAMPLE_ALERT.module,
      alertType: SAMPLE_ALERT.alertType,
      triggerType: SAMPLE_ALERT.triggerType,
      thresholdDays: SAMPLE_ALERT.thresholdDays,
      startDate: SAMPLE_ALERT.startDate,
      endDate: SAMPLE_ALERT.endDate,
      emailTo: SAMPLE_ALERT.emailTo,
      shipments: SAMPLE_ALERT.shipments,
      enabled: SAMPLE_ALERT.enabled,
      emailEnabled: SAMPLE_ALERT.emailEnabled ?? true,
      notificationEnabled: SAMPLE_ALERT.notificationEnabled ?? false,
      companyName: SAMPLE_ALERT.companyName,
      portOfDeparture: SAMPLE_ALERT.portOfDeparture,
      portOfArrival: SAMPLE_ALERT.portOfArrival,
      carrier: SAMPLE_ALERT.carrier,
      hazardousGoods: SAMPLE_ALERT.hazardousGoods
    };

    service.updateAlert(SAMPLE_ALERT.id, payload).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/alerts/${SAMPLE_ALERT.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...SAMPLE_ALERT, ...payload });
  });

  it('should request notification enabled alerts', () => {
    let alerts: AlertDto[] | undefined;

    service.getNotificationEnabledAlerts().subscribe((data) => (alerts = data));

    const req = httpMock.expectOne(`${BASE_URL}/alerts/notification-enabled`);
    expect(req.request.method).toBe('GET');
    req.flush([SAMPLE_ALERT]);

    expect(alerts).toEqual([SAMPLE_ALERT]);
  });
});
