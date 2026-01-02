import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { MainPanelComponent } from '../../../shared/components/main-panel/main-panel.component';
import { UserEditComponent } from './user-edit/user-edit.component';
import { UserManagementService, User } from './user-management.service';
@Component({
  selector: 'app-user-management',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    PaginatorModule,
    MainPanelComponent,
    UserEditComponent
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchText: string = '';
  
  // Pagination
  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;

  // View State
  isEditView: boolean = false;
  selectedUser: User | null = null;
  isLoading: boolean = false;

  constructor(private userService: UserManagementService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    const pageNo = Math.floor(this.first / this.rows) + 1;
    
    this.userService.searchActiveUsers(pageNo, this.rows, this.searchText).subscribe({
      next: (result) => {
        this.users = result.users;
        this.filteredUsers = result.users;
        this.totalRecords = result.totalCount;
        this.isLoading = false;
        console.log('Users loaded:', result);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
        this.users = [];
        this.filteredUsers = [];
        this.totalRecords = 0;
      }
    });
  }

  onSearch() {
    this.first = 0; // Reset to first page
    this.loadUsers(); // Reload with search term
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.loadUsers(); // Reload data for new page
  }

  editUser(user: User) {
    this.selectedUser = { ...user };
    this.isEditView = true;
  }

  onCancelEdit() {
    this.isEditView = false;
    this.selectedUser = null;
  }

  onSaveUser(updatedUser: User) {
    const index = this.users.findIndex(
      u => u.emailAddress === updatedUser.emailAddress
    );
    if (index !== -1) {
      this.users[index] = { ...updatedUser };
    }
    this.filteredUsers = [...this.users];
    this.isEditView = false;
    this.selectedUser = null;
  }

  getDisplayCompanies(user: User): string {
    if (user.assignedCompaniesCount && user.assignedCompaniesCount > 2) {
      const companies = user.assignedCompanies.split(',').slice(0, 2).join(',');
      return companies;
    }
    return user.assignedCompanies;
  }

  getMoreCount(user: User): number {
    if (user.assignedCompaniesCount && user.assignedCompaniesCount > 2) {
      return user.assignedCompaniesCount - 2;
    }
    return 0;
  }
}
