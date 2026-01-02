import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// API Response Interfaces
export interface CompanyData {
  id: number;
  name: string;
  parentCompanyId: number | null;
}

export interface CompanyApiResponse {
  timestamp: string;
  status: string;
  message: string | null;
  data: CompanyData[];
}

// UI Model with hierarchy support
export interface Company {
  id: number;
  name: string;
  parentCompanyId: number | null;
  selected: boolean;
  expanded?: boolean;
  level: number;
  children?: Company[];
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly API_BASE_URL = 'http://192.168.0.43:8080/smart-sdm-api/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Get list of all companies
   */
  getCompanyList(): Observable<Company[]> {
    return this.http.get<CompanyApiResponse>(`${this.API_BASE_URL}/admin/company/list`)
      .pipe(
        map(response => this.transformToHierarchy(response.data)),
        catchError(error => {
          console.error('Error fetching companies:', error);
          console.log('Using mock company data as fallback');
          return of(this.getMockCompanies());
        })
      );
  }

  /**
   * Transform flat company list to hierarchical structure
   */
  private transformToHierarchy(companies: CompanyData[]): Company[] {
    // Convert to UI model
    const companyMap = new Map<number, Company>();
    const rootCompanies: Company[] = [];

    // First pass: Create all company objects
    companies.forEach(company => {
      companyMap.set(company.id, {
        id: company.id,
        name: company.name,
        parentCompanyId: company.parentCompanyId,
        selected: false,
        expanded: false,
        level: 0,
        children: []
      });
    });

    // Second pass: Build hierarchy
    companies.forEach(company => {
      const companyNode = companyMap.get(company.id)!;
      
      if (company.parentCompanyId === null) {
        // Root level company
        rootCompanies.push(companyNode);
      } else {
        // Child company - add to parent
        const parent = companyMap.get(company.parentCompanyId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          companyNode.level = parent.level + 1;
          parent.children.push(companyNode);
        } else {
          // Parent not found, treat as root
          rootCompanies.push(companyNode);
        }
      }
    });

    return rootCompanies;
  }

  /**
   * Get flat list of companies (no hierarchy)
   */
  getFlatCompanyList(): Observable<Company[]> {
    return this.http.get<CompanyApiResponse>(`${this.API_BASE_URL}/admin/company/list`)
      .pipe(
        map(response => response.data.map(company => ({
          id: company.id,
          name: company.name,
          parentCompanyId: company.parentCompanyId,
          selected: false,
          expanded: false,
          level: 0,
          children: []
        }))),
        catchError(error => {
          console.error('Error fetching companies:', error);
          return of([]);
        })
      );
  }

  /**
   * Search companies by name
   */
  searchCompanies(companies: Company[], searchText: string): Company[] {
    if (!searchText.trim()) {
      return companies;
    }

    const searchLower = searchText.toLowerCase();
    return this.filterCompanies(companies, searchLower);
  }

  /**
   * Recursively filter companies by search text
   */
  private filterCompanies(companies: Company[], searchText: string): Company[] {
    const filtered: Company[] = [];
    
    companies.forEach(company => {
      if (company.name.toLowerCase().includes(searchText)) {
        filtered.push({ ...company, expanded: true });
      } else if (company.children && company.children.length > 0) {
        const filteredChildren = this.filterCompanies(company.children, searchText);
        if (filteredChildren.length > 0) {
          filtered.push({ ...company, children: filteredChildren, expanded: true });
        }
      }
    });

    return filtered;
  }

  /**
   * Get mock company data for fallback
   */
  private getMockCompanies(): Company[] {
    const mockCompaniesData: CompanyData[] = [
      { id: 419, name: '3M COMPANY', parentCompanyId: null },
      { id: 971043, name: '3M BANGOR', parentCompanyId: 419 },
      { id: 971051, name: '3M BELGIUM NV/SA', parentCompanyId: 419 },
      { id: 971044, name: '3M CANADA', parentCompanyId: 419 },
      { id: 971048, name: '3M CHINA LIMITED', parentCompanyId: 419 },
      { id: 67429, name: 'ACRYLIC MONOMERS', parentCompanyId: null },
      { id: 67548, name: 'ADHESIVES & FUNCTIONAL MATERIALS', parentCompanyId: null },
      { id: 67428, name: 'AMINES', parentCompanyId: null },
      { id: 67431, name: 'ARCHITECTURAL COATINGS', parentCompanyId: null },
      { id: 1001, name: 'Steel Case', parentCompanyId: null },
      { id: 2001, name: 'Building Innovations', parentCompanyId: null },
      { id: 2002, name: 'Central R&D', parentCompanyId: null },
      { id: 67427, name: 'DOW HOME & PERSONAL CARE', parentCompanyId: null },
      { id: 67423, name: 'ELECTRICAL & TELECOMMUNICATIONS', parentCompanyId: null },
      { id: 551, name: 'DUPONT SPECIALTY PRODUCTS LLC', parentCompanyId: null },
      { id: 770381, name: 'DUPONT MATERIAL SCIENCE', parentCompanyId: 551 },
      { id: 58106, name: 'MOMENTIVE', parentCompanyId: null },
      { id: 326636, name: 'ARKEMA SA FRANCE', parentCompanyId: null },
      { id: 67424, name: 'GROWTH TECHNOLOGIES', parentCompanyId: null },
      { id: 67532, name: 'ION EXCHANGE', parentCompanyId: null }
    ];
    
    return this.transformToHierarchy(mockCompaniesData);
  }
}
