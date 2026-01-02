import { Component, OnInit, ContentChild, TemplateRef, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { filter, distinctUntilChanged } from 'rxjs/operators';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent implements OnInit, AfterContentInit {
  breadcrumbs: Breadcrumb[] = [];
  @ContentChild('breadcrumbActions') actionsTemplate!: TemplateRef<any>;

  ngAfterContentInit() {
    // Content projection will be available here
  }

  // Route label mapping
  private routeLabels: { [key: string]: string } = {
    'arrival': 'Arrival',
    'carrier-release': 'Carrier Release',
    'customs-declaration': 'Customs Declaration',
    'delivery': 'Delivery',
    'alerts': 'Alerts',
    'user-management': 'User Management',
    'master-data': 'Master Data',
    'shipment': 'Shipment No'
  };

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
      });

    // Initial breadcrumb generation
    this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
  }

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    // Get the child routes
    const children: ActivatedRoute[] = route.children;

    // Return if there are no more children
    if (children.length === 0) {
      return breadcrumbs;
    }

    // Iterate over each child
    for (const child of children) {
      // Get the route's URL segments
      const urlSegments = child.snapshot.url;
      
      // Process each URL segment individually to create separate breadcrumbs
      for (let i = 0; i < urlSegments.length; i++) {
        const segment = urlSegments[i];
        const segmentPath = segment.path;
        
        // Skip empty segments
        if (segmentPath === '') {
          continue;
        }

        url += `/${segmentPath}`;

        // Get route params (like shipmentNo)
        const params = child.snapshot.params;
        let label = '';
        
        // Check if this segment is a parameter value
        const paramKeys = Object.keys(params);
        const isParamValue = paramKeys.some(key => params[key] === segmentPath);
        
        if (isParamValue) {
          // Find the param key for this value
          const paramKey = paramKeys.find(key => params[key] === segmentPath);
          
          // Format label based on parameter type
          if (paramKey === 'shipmentNo') {
            label = `Shipment No: ${segmentPath}`;
          } else {
            label = `${this.formatLabel(paramKey!)}: ${segmentPath}`;
          }
        } else {
          // Regular route segment - use label mapping or format it
          label = this.routeLabels[segmentPath] || this.formatLabel(segmentPath);
        }

        // Add breadcrumb for this segment
        const breadcrumb: Breadcrumb = {
          label: label,
          url: url
        };
        breadcrumbs.push(breadcrumb);
      }

      // Recursive call for child routes
      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  private formatLabel(str: string): string {
    // Convert kebab-case to Title Case
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
