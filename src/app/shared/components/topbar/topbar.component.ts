import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../auth/auth.service';
import { AlertsService, AlertDto } from '../../../pages/alerts/alerts/alerts.service';

interface ShipmentAlert {
  id: number;
  name: string;
  lastTriggeredDate: string | null;
  shipmentNumbers: string[];
  module: string;
  status: string | null;
}

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, ButtonModule, AvatarModule, BadgeModule, TooltipModule, MenuModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})

export class TopbarComponent implements OnInit {
  @ViewChild('menu') menu!: Menu;
  
  userMenuItems: MenuItem[] = [];
  username: string = '';
  userInitials: string = 'SU';
  alertsPanelVisible = false;
  shipmentAlerts: ShipmentAlert[] = [];
  unreadCount = 0;

  constructor(
    private authService: AuthService, 
    private alertsService: AlertsService,
    private router: Router, 
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    const userData = this.authService.getUserData();
    
    if (userData && userData.username) {
      // New JWT-based user data
      this.username = userData.username;
      this.userInitials = userData.username.substring(0, 2).toUpperCase();
    } else {
      // Fallback
      this.username = 'User';
      this.userInitials = 'SU';
    }
    
    this.userMenuItems = [
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => {
          this.logout();
        }
      }
    ];

    this.loadNotificationAlerts();
  }

  loadNotificationAlerts(): void {
    this.alertsService.getNotificationEnabledAlerts().subscribe({
      next: (alerts) => {
        this.shipmentAlerts = alerts
          .filter(alert => alert.notificationEnabled === true)
          .map(alert => ({
            id: alert.id,
            name: alert.name,
            lastTriggeredDate: alert.lastTriggeredDate,
            shipmentNumbers: alert.shipments,
            module: alert.module,
            status: alert.status
          }));
        this.unreadCount = this.shipmentAlerts.length;
      },
      error: (error) => {
        console.error('Failed to load notification alerts:', error);
        this.shipmentAlerts = [];
        this.unreadCount = 0;
      }
    });
  }

  toggleAlertsPanel(event: Event): void {
    event.stopPropagation();
    this.alertsPanelVisible = !this.alertsPanelVisible;
    if (this.alertsPanelVisible && this.unreadCount > 0) {
      this.unreadCount = 0;
    }
  }

  toggleMenu(event: Event) {
    if (this.menu) {
      this.menu.toggle(event);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.alertsPanelVisible && !this.elementRef.nativeElement.contains(event.target)) {
      this.alertsPanelVisible = false;
    }
  }

  logout() {
    this.authService.logout().subscribe({
      complete: () => {
        // User is logged out and redirected by the service
      },
      error: (err) => {
        // Even on error, user is logged out locally
        console.error('Logout error:', err);
      }
    });
  }
}
