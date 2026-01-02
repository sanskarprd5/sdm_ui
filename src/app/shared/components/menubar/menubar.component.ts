import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-menubar',
  imports: [CommonModule, MenuModule, RouterModule],
  templateUrl: './menubar.component.html',
  styleUrl: './menubar.component.scss'
})
export class MenubarComponent implements OnInit {
  @ViewChild('masterDataMenu') masterDataMenu!: Menu;
  @ViewChild('alertsMenu') alertsMenu!: Menu;
  
  isMenuOpen = false;
  currentRoute = '';
  masterDataMenuItems: MenuItem[] = [
    {
      label: 'User Management',
      icon: 'pi pi-users',
      command: () => {
        this.router.navigate(['/user-management']);
        this.closeMenu();
      }
    }
  ];

  alertsMenuItems: MenuItem[] = [
    {
      label: 'Arrival',
      icon: 'pi pi-map-marker',
      command: () => {
        this.router.navigate(['/alerts/arrival']);
        this.closeMenu();
      }
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    // Track route changes to update active menu item
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.urlAfterRedirects;
    });
    
    // Set initial route
    this.currentRoute = this.router.url;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  toggleMasterDataMenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    // Close alerts menu if open
    if (this.alertsMenu) {
      this.alertsMenu.hide();
    }
    if (this.masterDataMenu) {
      this.masterDataMenu.toggle(event);
    }
  }

  toggleAlertsMenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    // Close master data menu if open
    if (this.masterDataMenu) {
      this.masterDataMenu.hide();
    }
    if (this.alertsMenu) {
      this.alertsMenu.toggle(event);
    }
  }

  /**
   * Check if a menu item is active based on current route
   */
  isActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }

  /**
   * Navigate to a specific route
   */
  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeMenu();
  }
}
