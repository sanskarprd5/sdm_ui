import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MainPanelComponent } from './main-panel.component';
import { AuthService } from '../../../auth/auth.service';
import { AlertsService } from '../../../pages/alerts/alerts/alerts.service';

describe('MainPanelComponent', () => {
  let component: MainPanelComponent;
  let fixture: ComponentFixture<MainPanelComponent>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserData', 'logout']);
    authServiceSpy.getUserData.and.returnValue({ username: 'testuser' });
    authServiceSpy.logout.and.returnValue(of(void 0));

    const alertsServiceSpy = jasmine.createSpyObj('AlertsService', ['getNotificationEnabledAlerts']);
    alertsServiceSpy.getNotificationEnabledAlerts.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MainPanelComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AlertsService, useValue: alertsServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
