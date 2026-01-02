import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { UserEditComponent } from './user-edit.component';
import { CompanyService, Company } from '../company.service';
import { UserManagementService, User } from '../user-management.service';

describe('UserEditComponent', () => {
  let component: UserEditComponent;
  let fixture: ComponentFixture<UserEditComponent>;
  let companyService: jasmine.SpyObj<CompanyService>;
  let userManagementService: jasmine.SpyObj<UserManagementService>;

  const mockUser: User = {
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
  };

  beforeEach(async () => {
    companyService = jasmine.createSpyObj('CompanyService', ['getCompanyList', 'searchCompanies']);
    companyService.getCompanyList.and.returnValue(of([]));
    companyService.searchCompanies.and.callFake((companies: Company[]) => companies);

    userManagementService = jasmine.createSpyObj('UserManagementService', ['saveUserCompanies']);
    userManagementService.saveUserCompanies.and.returnValue(of({
      timestamp: '',
      status: 'SUCCESS',
      message: 'Saved',
      data: null
    }));

    await TestBed.configureTestingModule({
      imports: [UserEditComponent],
      providers: [
        { provide: CompanyService, useValue: companyService },
        { provide: UserManagementService, useValue: userManagementService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserEditComponent);
    component = fixture.componentInstance;
    component.user = mockUser;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load companies on init', () => {
    expect(companyService.getCompanyList).toHaveBeenCalled();
  });

  it('should save selected companies', fakeAsync(() => {
    const selectedCompany: Company = {
      id: 1,
      name: 'ACME',
      parentCompanyId: null,
      selected: true,
      expanded: false,
      level: 0,
      children: []
    };

    component.companies = [selectedCompany];
    component.filteredCompanies = [selectedCompany];

    spyOn(component.onSave, 'emit');

    component.saveChanges();
    tick(1500);

    expect(userManagementService.saveUserCompanies).toHaveBeenCalled();
    expect(component.onSave.emit).toHaveBeenCalled();
  }));
});
