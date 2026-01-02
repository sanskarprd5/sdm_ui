import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TopbarComponent } from '../topbar/topbar.component';
import { FooterComponent } from '../footer/footer.component';
import { MenubarComponent } from '../menubar/menubar.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { FilterButtonComponent } from '../filter-button/filter-button.component';

@Component({
  selector: 'app-main-panel',
  imports: [
    TopbarComponent,
    FooterComponent,
    MenubarComponent,
    BreadcrumbComponent,
    FilterButtonComponent
  ],
  templateUrl: './main-panel.component.html',
  styleUrl: './main-panel.component.scss'
})
export class MainPanelComponent {
  @Input() showFilterButton: boolean = false;
  @Input() showFilters: boolean = false;
  @Output() showFiltersChange = new EventEmitter<boolean>();
  @Output() onFilterToggle = new EventEmitter<boolean>();

  handleFilterToggle(show: boolean): void {
    this.showFilters = show;
    this.showFiltersChange.emit(show);
    this.onFilterToggle.emit(show);
  }
}
