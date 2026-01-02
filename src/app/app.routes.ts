import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { LoginComponent } from './login/login.component';
import { ArrivalComponent } from './pages/arrival/arrival/arrival.component';
import { ShipmentConfigComponent } from './pages/arrival/shipment-config/shipment-config.component';
import { UserManagementComponent } from './pages/master-data/user-management/user-management.component';
import { AlertsComponent } from './pages/alerts/alerts/alerts.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'arrival',
    canActivate: [AuthGuard],
    component: ArrivalComponent
  },
  {
    path: 'arrival/shipment/:shipmentNo',
    canActivate: [AuthGuard],
    component: ShipmentConfigComponent
  },
  {
    path: 'alerts/arrival',
    canActivate: [AuthGuard],
    component: AlertsComponent
  },
  {
    path: 'user-management',
    canActivate: [AuthGuard],
    component: UserManagementComponent
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
