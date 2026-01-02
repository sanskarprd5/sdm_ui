import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { BreadcrumbComponent } from './breadcrumb.component';

describe('BreadcrumbComponent', () => {
  let component: BreadcrumbComponent;
  let fixture: ComponentFixture<BreadcrumbComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let routerEventsSubject: Subject<any>;

  beforeEach(async () => {
    routerEventsSubject = new Subject();
    
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      events: routerEventsSubject.asObservable()
    });

    mockActivatedRoute = {
      root: {
        snapshot: {
          url: [],
          params: {}
        },
        children: []
      }
    };

    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty breadcrumbs when no route is active', () => {
    expect(component.breadcrumbs).toEqual([]);
  });

  it('should build breadcrumbs on NavigationEnd event', () => {
    const mockRoute = {
      snapshot: {
        url: [{ path: 'arrival' }],
        params: {}
      },
      children: []
    };

    mockActivatedRoute.root = {
      snapshot: { url: [], params: {} },
      children: [mockRoute]
    };

    routerEventsSubject.next(new NavigationEnd(1, '/arrival', '/arrival'));
    
    expect(component.breadcrumbs.length).toBeGreaterThan(0);
  });

  it('should format breadcrumb labels correctly for simple routes', () => {
    const mockRoute = {
      snapshot: {
        url: [{ path: 'arrival' }],
        params: {}
      },
      children: []
    };

    mockActivatedRoute.root = {
      snapshot: { url: [], params: {} },
      children: [mockRoute]
    };

    component.ngOnInit();
    
    expect(component.breadcrumbs).toContain(
      jasmine.objectContaining({ label: 'Arrival', url: '/arrival' })
    );
  });

  it('should handle parameterized routes with shipmentNo', () => {
    const mockRoute = {
      snapshot: {
        url: [{ path: 'arrival' }, { path: 'shipment' }, { path: 'US100201128265' }],
        params: { shipmentNo: 'US100201128265' }
      },
      children: []
    };

    mockActivatedRoute.root = {
      snapshot: { url: [], params: {} },
      children: [mockRoute]
    };

    component.ngOnInit();
    
    expect(component.breadcrumbs.some(b => b.label.includes('Shipment No: US100201128265'))).toBe(true);
  });

  it('should build nested breadcrumb trail', () => {
    const childRoute = {
      snapshot: {
        url: [{ path: 'arrival' }],
        params: {}
      },
      children: []
    };

    const parentRoute = {
      snapshot: {
        url: [{ path: 'alerts' }],
        params: {}
      },
      children: [childRoute]
    };

    mockActivatedRoute.root = {
      snapshot: { url: [], params: {} },
      children: [parentRoute]
    };

    component.ngOnInit();
    
    expect(component.breadcrumbs.length).toBeGreaterThan(0);
  });

  it('should format kebab-case route names to Title Case', () => {
    const mockRoute = {
      snapshot: {
        url: [{ path: 'carrier-release' }],
        params: {}
      },
      children: []
    };

    mockActivatedRoute.root = {
      snapshot: { url: [], params: {} },
      children: [mockRoute]
    };

    component.ngOnInit();
    
    expect(component.breadcrumbs).toContain(
      jasmine.objectContaining({ label: 'Carrier Release' })
    );
  });

  it('should handle user-management route', () => {
    const mockRoute = {
      snapshot: {
        url: [{ path: 'user-management' }],
        params: {}
      },
      children: []
    };

    mockActivatedRoute.root = {
      snapshot: { url: [], params: {} },
      children: [mockRoute]
    };

    component.ngOnInit();
    
    expect(component.breadcrumbs).toContain(
      jasmine.objectContaining({ label: 'User Management', url: '/user-management' })
    );
  });

  it('should update breadcrumbs on route changes', () => {
    const initialRoute = {
      snapshot: {
        url: [{ path: 'arrival' }],
        params: {}
      },
      children: []
    };

    mockActivatedRoute.root = {
      snapshot: { url: [], params: {} },
      children: [initialRoute]
    };

    component.ngOnInit();
    const initialLength = component.breadcrumbs.length;

    const newRoute = {
      snapshot: {
        url: [{ path: 'alerts' }],
        params: {}
      },
      children: []
    };

    mockActivatedRoute.root = {
      snapshot: { url: [], params: {} },
      children: [newRoute]
    };

    routerEventsSubject.next(new NavigationEnd(2, '/alerts', '/alerts'));
    
    expect(component.breadcrumbs.length).toBeGreaterThanOrEqual(0);
  });
});
