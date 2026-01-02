import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiResponse, AssignedCompany, UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let httpMock: HttpTestingController;
  const API_BASE = 'http://192.168.0.43:8080/smart-sdm-api/api/v1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(UserManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const buildUser = (overrides: Partial<AssignedCompany> = {}) => ({
    companyId: overrides.companyId ?? 1,
    companyName: overrides.companyName ?? 'ACME'
  });

  it('should transform API search results into UI-friendly data', () => {
    const apiResponse: ApiResponse = {
      timestamp: 'now',
      status: 'SUCCESS',
      message: null,
      data: [
        {
          pageNo: 2,
          pageSize: 25,
          totalCount: 50,
          order: { column: 'firstName', dir: 'asc' },
          keySearch: 'john',
          data: [
            {
              userType: 'BDP',
              userTypeLabel: 'BDP User',
              userId: 'john.doe',
              userEmail: 'john.doe@example.com',
              firstName: 'John',
              lastName: 'Doe',
              company: 'BDP',
              assignedCompanies: [buildUser({ companyName: 'Co A' }), buildUser({ companyName: 'Co B' })],
              createdBy: null,
              enable: true
            }
          ],
          fieldSearch: []
        }
      ]
    };

    service.searchActiveUsers(2, 25, 'john').subscribe(result => {
      expect(result.pageNo).toBe(2);
      expect(result.pageSize).toBe(25);
      expect(result.totalCount).toBe(50);
      expect(result.users.length).toBe(1);
      expect(result.users[0].assignedCompanies).toBe('Co A, Co B');
      expect(result.users[0].assignedCompaniesCount).toBe(2);
    });

    const req = httpMock.expectOne(`${API_BASE}/admin/searchActiveUser`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ pageNo: 2, pageSize: 25, keySearch: 'john' });
    req.flush(apiResponse);
  });

  it('should return empty payload when API data is missing', () => {
    const apiResponse: ApiResponse = { timestamp: 'now', status: 'SUCCESS', message: null, data: [] };

    service.searchActiveUsers().subscribe(result => {
      expect(result.users).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.pageNo).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    const req = httpMock.expectOne(`${API_BASE}/admin/searchActiveUser`);
    req.flush(apiResponse);
  });

  it('should fall back to mock users on search error and honor filter term', () => {
    service.searchActiveUsers(1, 10, 'jagabandhu').subscribe(result => {
      expect(result.totalCount).toBe(1);
      expect(result.users[0].emailAddress).toBe('jagabandhu.jena@bdpint.com');
    });

    const req = httpMock.expectOne(`${API_BASE}/admin/searchActiveUser`);
    req.flush('error', { status: 500, statusText: 'Server Error' });
  });

  it('should save user companies successfully', () => {
    const companies = [{ companyId: 1, companyName: 'ACME' }];

    service.saveUserCompanies('john.doe', 'BDP', companies).subscribe(response => {
      expect(response.status).toBe('SUCCESS');
    });

    const req = httpMock.expectOne(`${API_BASE}/admin/company/saveOrUpdate`);
    expect(req.request.body).toEqual({ userName: 'john.doe', userType: 'BDP', companyDetails: companies });
    req.flush({ timestamp: 'now', status: 'SUCCESS', message: 'Saved', data: null });
  });

  it('should propagate errors when save user companies fails', () => {
    const companies = [{ companyId: 1, companyName: 'ACME' }];

    service.saveUserCompanies('john.doe', 'BDP', companies).subscribe({
      next: () => fail('Expected request to error'),
      error: err => {
        expect(err.status).toBe(400);
      }
    });

    const req = httpMock.expectOne(`${API_BASE}/admin/company/saveOrUpdate`);
    req.flush('bad', { status: 400, statusText: 'Bad Request' });
  });
});
