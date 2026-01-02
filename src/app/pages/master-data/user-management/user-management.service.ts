import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// API Request Interface
export interface SearchUserRequest {
  pageNo: number;
  pageSize: number;
  keySearch: string;
}

// Save/Update User Company Assignment Request
export interface SaveUserCompanyRequest {
  userName: string;
  userType: string;
  companyDetails: CompanyDetail[];
}

export interface CompanyDetail {
  companyId: number;
  companyName: string;
}

// Save/Update Response
export interface SaveUserCompanyResponse {
  timestamp: string;
  status: string;
  message: string | null;
  data: any;
}

// API Response Interfaces
export interface AssignedCompany {
  companyId: number;
  companyName: string;
}

export interface UserData {
  userType: string;
  userTypeLabel: string;
  userId: string;
  userEmail: string;
  firstName: string;
  lastName: string;
  company: string;
  assignedCompanies: AssignedCompany[];
  createdBy: string | null;
  enable: boolean;
}

export interface UserSearchData {
  pageNo: number;
  pageSize: number;
  totalCount: number;
  order: {
    column: string;
    dir: string;
  };
  keySearch: string;
  data: UserData[];
  fieldSearch: any[];
}

export interface ApiResponse {
  timestamp: string;
  status: string;
  message: string | null;
  data: UserSearchData[];
}

// UI Model
export interface User {
  firstName: string;
  lastName: string;
  companyName: string;
  emailAddress: string;
  assignedCompanies: string;
  assignedCompaniesCount: number;
  userType: string;
  userTypeLabel: string;
  userId: string;
  assignedCompanyList?: AssignedCompany[];
  enable: boolean;
}

export interface PagedUserResult {
  users: User[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly API_BASE_URL = 'http://192.168.0.43:8080/smart-sdm-api/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Search active users with pagination
   */
  searchActiveUsers(pageNo: number = 1, pageSize: number = 10, keySearch: string = ''): Observable<PagedUserResult> {
    const request: SearchUserRequest = {
      pageNo,
      pageSize,
      keySearch
    };

    return this.http.post<ApiResponse>(`${this.API_BASE_URL}/admin/searchActiveUser`, request)
      .pipe(
        map(response => this.transformResponse(response)),
        catchError(error => {
          console.error('Error fetching users:', error);
          console.log('Using mock data as fallback');
          return of(this.getMockUsers(pageNo, pageSize, keySearch));
        })
      );
  }

  /**
   * Transform API response to UI model
   */
  private transformResponse(response: ApiResponse): PagedUserResult {
    if (!response.data || response.data.length === 0) {
      return { users: [], totalCount: 0, pageNo: 1, pageSize: 10 };
    }

    const searchData = response.data[0];
    const users: User[] = searchData.data.map(userData => this.transformUserData(userData));

    return {
      users,
      totalCount: searchData.totalCount,
      pageNo: searchData.pageNo,
      pageSize: searchData.pageSize
    };
  }

  /**
   * Transform single user data to UI model
   */
  private transformUserData(userData: UserData): User {
    // Format assigned companies as comma-separated string
    const assignedCompaniesStr = userData.assignedCompanies
      .map(c => c.companyName)
      .join(', ');

    return {
      firstName: userData.firstName,
      lastName: userData.lastName,
      companyName: userData.company,
      emailAddress: userData.userEmail,
      assignedCompanies: assignedCompaniesStr,
      assignedCompaniesCount: userData.assignedCompanies.length,
      userType: userData.userType,
      userTypeLabel: userData.userTypeLabel,
      userId: userData.userId,
      assignedCompanyList: userData.assignedCompanies,
      enable: userData.enable
    };
  }

  /**
   * Save or update user company assignments
   */
  saveUserCompanies(userName: string, userType: string, companyDetails: CompanyDetail[]): Observable<SaveUserCompanyResponse> {
    const request: SaveUserCompanyRequest = {
      userName,
      userType,
      companyDetails
    };

    return this.http.post<SaveUserCompanyResponse>(`${this.API_BASE_URL}/admin/company/saveOrUpdate`, request)
      .pipe(
        catchError(error => {
          console.error('Error saving user companies:', error);
          throw error;
        })
      );
  }

  /**
   * Get mock users data for fallback
   */
  private getMockUsers(pageNo: number, pageSize: number, keySearch: string): PagedUserResult {
    const allMockUsers: User[] = [
      {
        firstName: 'Jagabandhu',
        lastName: 'Jena',
        companyName: 'Cozentus',
        emailAddress: 'jagabandhu.jena@bdpint.com',
        assignedCompanies: 'ACRYLIC MONOMERS, ADHESIVES & FUNCTIONAL MATERIALS, AMINES',
        assignedCompaniesCount: 67,
        userType: 'BDP_OPERATION_USER',
        userTypeLabel: 'BDP Operation User',
        userId: 'jagabandhu.jena@bdpint.com',
        enable: true,
        assignedCompanyList: [
          { companyId: 67429, companyName: 'ACRYLIC MONOMERS' },
          { companyId: 67548, companyName: 'ADHESIVES & FUNCTIONAL MATERIALS' },
          { companyId: 67428, companyName: 'AMINES' }
        ]
      },
      {
        firstName: 'Charloette',
        lastName: 'Olivia',
        companyName: 'BDP Int',
        emailAddress: 'charloette.olivia@bdpint.com',
        assignedCompanies: 'Steel Case',
        assignedCompaniesCount: 1,
        userType: 'BDP_OPERATION_USER',
        userTypeLabel: 'BDP Operation User',
        userId: 'charloette.olivia@bdpint.com',
        enable: true,
        assignedCompanyList: [
          { companyId: 1001, companyName: 'Steel Case' }
        ]
      },
      {
        firstName: 'Ranjeet',
        lastName: 'Das',
        companyName: 'BDP Int',
        emailAddress: 'ranjeet.das@bdpint.com',
        assignedCompanies: 'Building Innovations, Central R&D, DOW HOME & PERSONAL CARE',
        assignedCompaniesCount: 33,
        userType: 'BDP_OPERATION_USER',
        userTypeLabel: 'BDP Operation User',
        userId: 'ranjeet.das@bdpint.com',
        enable: true,
        assignedCompanyList: [
          { companyId: 2001, companyName: 'Building Innovations' },
          { companyId: 2002, companyName: 'Central R&D' },
          { companyId: 67427, companyName: 'DOW HOME & PERSONAL CARE' }
        ]
      },
      {
        firstName: 'Amelia',
        lastName: 'Clark',
        companyName: 'BDP Int',
        emailAddress: 'amelia.clark@bdpint.com',
        assignedCompanies: 'Steel Case',
        assignedCompaniesCount: 1,
        userType: 'CUSTOMER_USER',
        userTypeLabel: 'Customer User',
        userId: 'amelia.clark@bdpint.com',
        enable: true,
        assignedCompanyList: [
          { companyId: 1001, companyName: 'Steel Case' }
        ]
      },
      {
        firstName: 'Matt',
        lastName: 'Harper',
        companyName: 'BDP Int',
        emailAddress: 'matt.harper@bdpint.com',
        assignedCompanies: 'Building Innovations, Central R&D, ELECTRICAL & TELECOMMUNICATIONS',
        assignedCompaniesCount: 33,
        userType: 'BDP_OPERATION_USER',
        userTypeLabel: 'BDP Operation User',
        userId: 'matt.harper@bdpint.com',
        enable: true,
        assignedCompanyList: [
          { companyId: 2001, companyName: 'Building Innovations' },
          { companyId: 2002, companyName: 'Central R&D' },
          { companyId: 67423, companyName: 'ELECTRICAL & TELECOMMUNICATIONS' }
        ]
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        companyName: 'BDP Int',
        emailAddress: 'sarah.johnson@bdpint.com',
        assignedCompanies: 'THE DOW CHEMICAL COMPANY, DUPONT SPECIALTY PRODUCTS LLC',
        assignedCompaniesCount: 2,
        userType: 'SMART_SDM_ADMIN',
        userTypeLabel: 'Smart SDM Admin',
        userId: 'sarah.johnson@bdpint.com',
        enable: true,
        assignedCompanyList: [
          { companyId: 419, companyName: 'THE DOW CHEMICAL COMPANY' },
          { companyId: 551, companyName: 'DUPONT SPECIALTY PRODUCTS LLC' }
        ]
      }
    ];

    // Filter by search term if provided
    let filteredUsers = allMockUsers;
    if (keySearch && keySearch.trim()) {
      const searchLower = keySearch.toLowerCase();
      filteredUsers = allMockUsers.filter(user =>
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.emailAddress.toLowerCase().includes(searchLower) ||
        user.companyName.toLowerCase().includes(searchLower) ||
        user.assignedCompanies.toLowerCase().includes(searchLower)
      );
    }

    // Paginate
    const startIndex = (pageNo - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      totalCount: filteredUsers.length,
      pageNo,
      pageSize
    };
  }
}