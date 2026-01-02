import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabViewModule } from 'primeng/tabview';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { UserManagementService, User, CompanyDetail } from '../user-management.service';
import { CompanyService, Company } from '../company.service';

@Component({
  selector: 'app-user-edit',
  imports: [
    CommonModule,
    FormsModule,
    TabViewModule,
    RadioButtonModule,
    ButtonModule
  ],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss'
})
export class UserEditComponent implements OnInit {
  @Input() user!: User;
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<User>();

  editUserType: string = 'bdp';
  activeTabIndex: number = 0;

  // Company Assignment properties
  selectAllCompanies: boolean = false;
  companySearchText: string = '';
  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  totalCompanies: number = 0;
  totalPages: number = 1;
  isLoadingCompanies: boolean = false;
  isSaving: boolean = false;
  saveErrorMessage: string = '';
  saveSuccessMessage: string = '';

  constructor(
    private companyService: CompanyService,
    private userManagementService: UserManagementService
  ) {}

  ngOnInit() {
    this.editUserType = this.user.userType || 'bdp';
    this.loadCompanies();
  }

  loadCompanies() {
    this.isLoadingCompanies = true;
    this.companyService.getCompanyList().subscribe({
      next: (companies) => {
        this.companies = companies;
        this.filteredCompanies = companies;
        this.totalCompanies = this.countAllCompanies(companies);
        this.totalPages = Math.ceil(this.totalCompanies / this.pageSize);
        this.isLoadingCompanies = false;
        console.log('Companies loaded:', companies.length, 'root companies');
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.isLoadingCompanies = false;
        this.initializeMockCompanies(); // Fallback to mock data
      }
    });
  }

  countAllCompanies(companies: Company[]): number {
    let count = companies.length;
    companies.forEach(company => {
      if (company.children && company.children.length > 0) {
        count += this.countAllCompanies(company.children);
      }
    });
    return count;
  }

  initializeMockCompanies() {
    // Initialize with sample data matching the Figma design
    this.companies = [
      { id: 1, name: 'BDP International', parentCompanyId: null, selected: false, expanded: false, level: 0, children: [] },
      { id: 2, name: 'BDP1', parentCompanyId: null, selected: false, expanded: false, level: 0, children: [] },
      {
        id: 3,
        name: 'Test 1',
        parentCompanyId: null,
        selected: true,
        expanded: true,
        level: 0,
        children: []
      },
      {
        id: 4,
        name: 'Good Year',
        parentCompanyId: null,
        selected: false,
        expanded: false,
        level: 0,
        children: []
      },
      {
        id: 5,
        name: 'Sam Technologies',
        parentCompanyId: null,
        selected: true,
        expanded: true,
        level: 0,
        children: [
          {
            id: 6,
            name: 'CTP Test',
            parentCompanyId: 5,
            selected: true,
            expanded: true,
            level: 1,
            children: [
              { id: 7, name: 'CTP Test 2', parentCompanyId: 6, selected: true, expanded: false, level: 2 },
              { id: 8, name: 'Dupont', parentCompanyId: 6, selected: true, expanded: false, level: 2 }
            ]
          }
        ]
      },
      {
        id: 9,
        name: 'Non-active',
        parentCompanyId: null,
        selected: false,
        expanded: false,
        level: 0,
        children: []
      }
    ];
    this.filteredCompanies = [...this.companies];
    this.totalCompanies = this.countAllCompanies(this.companies);
    this.totalPages = Math.ceil(this.totalCompanies / this.pageSize);
  }

  toggleCompany(company: Company) {
    company.expanded = !company.expanded;
  }

  onSelectAllCompanies() {
    this.selectAllInList(this.filteredCompanies, this.selectAllCompanies);
  }

  selectAllInList(companies: Company[], selected: boolean) {
    companies.forEach(company => {
      company.selected = selected;
      if (company.children) {
        this.selectAllInList(company.children, selected);
      }
    });
  }

  onCompanySelectionChange() {
    // Update select all checkbox based on individual selections
    this.selectAllCompanies = this.areAllSelected(this.filteredCompanies);
  }

  areAllSelected(companies: Company[]): boolean {
    return companies.every(company => {
      const childrenSelected = company.children ? this.areAllSelected(company.children) : true;
      return company.selected && childrenSelected;
    });
  }

  onSearchCompany() {
    this.filteredCompanies = this.companyService.searchCompanies(this.companies, this.companySearchText);
  }

  goToFirstPage() {
    this.currentPage = 1;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToLastPage() {
    this.currentPage = this.totalPages;
  }

  onPageSizeChange() {
    this.totalPages = Math.ceil(this.totalCompanies / this.pageSize);
    this.currentPage = 1;
  }

  onBack() {
    if (this.activeTabIndex > 0) {
      this.activeTabIndex--;
    }
  }

  onContinue() {
    if (this.activeTabIndex === 0) {
      // Move to Company Assignment tab
      this.activeTabIndex = 1;
    } else {
      // Save changes
      this.saveChanges();
    }
  }

  cancelEdit() {
    this.onCancel.emit();
  }

  saveChanges() {
    this.isSaving = true;
    this.saveErrorMessage = '';
    this.saveSuccessMessage = '';

    // Collect selected companies recursively
    const selectedCompanies = this.getSelectedCompanies(this.companies);
    
    // Transform to API format
    const companyDetails: CompanyDetail[] = selectedCompanies.map(company => ({
      companyId: company.id,
      companyName: company.name
    }));

    // Map user type to API format
    const userTypeMap: { [key: string]: string } = {
      'bdp': 'BDP_OPERATION_USER',
      'customer': 'CUSTOMER_USER',
      'admin': 'SMART_SDM_ADMIN'
    };

    const apiUserType = userTypeMap[this.editUserType] || 'BDP_OPERATION_USER';

    // Call API to save
    this.userManagementService.saveUserCompanies(
      this.user.emailAddress,
      apiUserType,
      companyDetails
    ).subscribe({
      next: (response) => {
        console.log('User companies saved successfully:', response);
        this.saveSuccessMessage = response.message || 'Changes saved successfully';
        this.isSaving = false;
        
        // Update user object with new data
        const updatedUser: User = {
          ...this.user,
          userType: this.editUserType,
          assignedCompanyList: companyDetails,
          assignedCompaniesCount: companyDetails.length,
          assignedCompanies: companyDetails.map(c => c.companyName).join(', ')
        };
        
        // Wait a moment to show success message, then emit save event
        setTimeout(() => {
          this.onSave.emit(updatedUser);
        }, 1500);
      },
      error: (error) => {
        console.error('Error saving user companies:', error);
        this.isSaving = false;
        this.saveErrorMessage = error.error?.message || 'Failed to save changes. Please try again.';
      }
    });
  }

  /**
   * Recursively get all selected companies
   */
  getSelectedCompanies(companies: Company[]): Company[] {
    let selected: Company[] = [];
    
    companies.forEach(company => {
      if (company.selected) {
        selected.push(company);
      }
      if (company.children && company.children.length > 0) {
        selected = selected.concat(this.getSelectedCompanies(company.children));
      }
    });
    
    return selected;
  }
}
