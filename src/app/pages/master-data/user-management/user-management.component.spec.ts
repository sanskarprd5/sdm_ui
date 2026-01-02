import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UserManagementComponent } from './user-management.component';
import { UserManagementService, PagedUserResult, User } from './user-management.service';
import { CompanyService } from './company.service';
import { AuthService } from '../../../auth/auth.service';
import { AlertsService } from '../../alerts/alerts/alerts.service';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let userService: jasmine.SpyObj<UserManagementService>;
  let authService: jasmine.SpyObj<AuthService>;
  let alertsService: jasmine.SpyObj<AlertsService>;

  const mockUsers: PagedUserResult = {
    users: [
      {
        firstName: 'Jane',
        lastName: 'Doe',
        companyName: 'BDP',
        emailAddress: 'jane.doe@bdp.com',
        assignedCompanies: 'BDP',
        assignedCompaniesCount: 1,
        userType: 'BDP_OPERATION_USER',
        userTypeLabel: 'BDP Operation User',
        userId: 'jane.doe@bdp.com',
        enable: true
      } as User
    ],
    totalCount: 1,
    pageNo: 1,
    pageSize: 10
  };

  beforeEach(async () => {
    const companyServiceSpy = jasmine.createSpyObj('CompanyService', ['getCompanyList', 'searchCompanies']);
    companyServiceSpy.getCompanyList.and.returnValue(of([]));
    companyServiceSpy.searchCompanies.and.callFake((companies: any) => companies);

    const userServiceSpy = jasmine.createSpyObj('UserManagementService', ['searchActiveUsers']);
    userServiceSpy.searchActiveUsers.and.returnValue(of(mockUsers));
    userService = userServiceSpy;

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserData', 'logout']);
    authServiceSpy.getUserData.and.returnValue({ username: 'JD' });
    authServiceSpy.logout.and.returnValue(of(null));
    authService = authServiceSpy;

    const alertsServiceSpy = jasmine.createSpyObj('AlertsService', ['getNotificationEnabledAlerts']);
    alertsServiceSpy.getNotificationEnabledAlerts.and.returnValue(of([]));
    alertsService = alertsServiceSpy;

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        provideRouter([]),
        { provide: UserManagementService, useValue: userServiceSpy },
        { provide: CompanyService, useValue: companyServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AlertsService, useValue: alertsServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(userService.searchActiveUsers).toHaveBeenCalledWith(1, 10, '');
    expect(component.users.length).toBe(1);
    expect(component.totalRecords).toBe(1);
  });

  it('should handle load error gracefully', () => {
    userService.searchActiveUsers.and.returnValue(throwError(() => new Error('API Error')));
    component.loadUsers();

    expect(component.isLoading).toBeFalse();
    expect(component.users.length).toBe(0);
    expect(component.filteredUsers.length).toBe(0);
  });
});
