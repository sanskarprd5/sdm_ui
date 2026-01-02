import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { MenubarComponent } from './menubar.component';

class RouterStub {
  private eventSubject = new Subject<NavigationEnd>();
  url = '/initial';
  navigate = jasmine.createSpy('navigate');
  events = this.eventSubject.asObservable();

  emit(event: NavigationEnd) {
    this.eventSubject.next(event);
  }
}

describe('MenubarComponent', () => {
  let component: MenubarComponent;
  let router: RouterStub;

  beforeEach(() => {
    router = new RouterStub();
    component = new MenubarComponent(router as unknown as Router);
  });

  it('should track current route through ngOnInit', () => {
    component.ngOnInit();
    expect(component.currentRoute).toBe(router.url);

    const targetUrl = '/alerts/arrival';
    router.emit(new NavigationEnd(1, '/alerts', targetUrl));

    expect(component.currentRoute).toBe(targetUrl);
  });

  it('should toggle menu visibility and close it', () => {
    component.toggleMenu();
    expect(component.isMenuOpen).toBeTrue();

    component.closeMenu();
    expect(component.isMenuOpen).toBeFalse();
  });

  it('should navigate via helper and close menu', () => {
    component.isMenuOpen = true;
    component.navigateTo('/target');

    expect(router.navigate).toHaveBeenCalledWith(['/target']);
    expect(component.isMenuOpen).toBeFalse();
  });

  it('should mark nested routes as active', () => {
    component.currentRoute = '/alerts/arrival';

    expect(component.isActive('/alerts')).toBeTrue();
    expect(component.isActive('/other')).toBeFalse();
  });

  it('should toggle master data menu and hide alerts menu', () => {
    const event = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation')
    } as unknown as Event;
    component.masterDataMenu = jasmine.createSpyObj('Menu', ['hide', 'toggle']);
    component.alertsMenu = jasmine.createSpyObj('Menu', ['hide', 'toggle']);

    component.toggleMasterDataMenu(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.alertsMenu.hide).toHaveBeenCalled();
    expect(component.masterDataMenu.toggle).toHaveBeenCalledWith(event);
  });

  it('should toggle alerts menu and hide master data menu', () => {
    const event = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation')
    } as unknown as Event;
    component.masterDataMenu = jasmine.createSpyObj('Menu', ['hide', 'toggle']);
    component.alertsMenu = jasmine.createSpyObj('Menu', ['hide', 'toggle']);

    component.toggleAlertsMenu(event);

    expect(component.masterDataMenu.hide).toHaveBeenCalled();
    expect(component.alertsMenu.toggle).toHaveBeenCalledWith(event);
  });

  it('should execute master data command and close menu', () => {
    component.isMenuOpen = true;
    component.masterDataMenuItems[0].command?.({} as any);

    expect(router.navigate).toHaveBeenCalledWith(['/user-management']);
    expect(component.isMenuOpen).toBeFalse();
  });

  it('should execute alerts command and close menu', () => {
    component.isMenuOpen = true;
    component.alertsMenuItems[0].command?.({} as any);

    expect(router.navigate).toHaveBeenCalledWith(['/alerts/arrival']);
    expect(component.isMenuOpen).toBeFalse();
  });
});
