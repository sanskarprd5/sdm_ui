import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AlertDto {
  id: number;
  name: string;
  module: string;
  alertType: number;
  triggerType: string;
  thresholdDays: number;
  startDate: string;
  endDate: string;
  emailTo: string[];
  shipments: string[];
  enabled: boolean;
  lastTriggeredDate: string | null;
  companyName: string;
  portOfDeparture: string;
  portOfArrival: string;
  carrier: string;
  hazardousGoods: boolean;
  emailEnabled: boolean | null;
  notificationEnabled: boolean | null;
  status: string | null;
}

export interface CreateAlertRequest {
  name: string;
  module: string;
  alertType: number;
  triggerType: string;
  thresholdDays: number;
  startDate: string;
  endDate: string;
  emailTo: string[];
  shipments: string[];
  enabled: boolean;
  emailEnabled: boolean;
  notificationEnabled: boolean;
  companyName: string;
  portOfDeparture: string;
  portOfArrival: string;
  carrier: string;
  hazardousGoods: boolean;
}

export interface UpdateAlertRequest {
  name: string;
  module: string;
  alertType: number;
  triggerType: string;
  thresholdDays: number;
  startDate: string;
  endDate: string;
  emailTo: string[];
  shipments: string[];
  enabled: boolean;
  emailEnabled: boolean;
  notificationEnabled: boolean;
  companyName: string;
  portOfDeparture: string;
  portOfArrival: string;
  carrier: string;
  hazardousGoods: boolean;
}

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly baseUrl = 'http://192.168.0.43:8080/smart-sdm-api/api/v1';

  constructor(private http: HttpClient) {}

  getAlerts(page = 0, size = 20): Observable<AlertDto[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<AlertDto[]>(`${this.baseUrl}/alerts`, { params });
  }

  createAlert(request: CreateAlertRequest): Observable<AlertDto> {
    return this.http.post<AlertDto>(`${this.baseUrl}/alerts`, request);
  }

  updateAlert(alertId: number, request: UpdateAlertRequest): Observable<AlertDto> {
    return this.http.put<AlertDto>(`${this.baseUrl}/alerts/${alertId}`, request);
  }

  getNotificationEnabledAlerts(): Observable<AlertDto[]> {
    return this.http.get<AlertDto[]>(`${this.baseUrl}/alerts/notification-enabled`);
  }
}
