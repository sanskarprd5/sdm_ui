import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTableComponent } from './common-table.component';

describe('CommonTableComponent', () => {
  let component: CommonTableComponent;
  let fixture: ComponentFixture<CommonTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.data).toEqual([]);
    expect(component.columns).toEqual([]);
    expect(component.loading).toBe(false);
    expect(component.paginator).toBe(true);
    expect(component.rows).toBe(10);
  });

  it('should emit pageChange event', () => {
    spyOn(component.pageChange, 'emit');
    const event = { first: 0, rows: 10 };
    component.onPageChange(event);
    expect(component.pageChange.emit).toHaveBeenCalledWith(event);
  });

  it('should emit rowSelect event', () => {
    spyOn(component.rowSelect, 'emit');
    const event = { data: { id: 1 } };
    component.onRowSelect(event);
    expect(component.rowSelect.emit).toHaveBeenCalledWith(event);
  });

  it('should emit selectionChange event', () => {
    spyOn(component.selectionChange, 'emit');
    const selection = [{ id: 1 }, { id: 2 }];
    component.onSelectionChange(selection);
    expect(component.selectionChange.emit).toHaveBeenCalledWith(selection);
    expect(component.selectedItems).toEqual(selection);
  });

  it('should emit searchChange event', () => {
    spyOn(component.searchChange, 'emit');
    const searchValue = 'test search';
    component.onSearch(searchValue);
    expect(component.searchChange.emit).toHaveBeenCalledWith(searchValue);
    expect(component.searchTerm).toBe(searchValue);
  });

  it('should execute action when not disabled or loading', () => {
    const mockAction = {
      label: 'Test Action',
      onClick: jasmine.createSpy('onClick')
    };
    component.executeAction(mockAction);
    expect(mockAction.onClick).toHaveBeenCalled();
  });

  it('should not execute action when disabled', () => {
    const mockAction = {
      label: 'Test Action',
      disabled: true,
      onClick: jasmine.createSpy('onClick')
    };
    component.executeAction(mockAction);
    expect(mockAction.onClick).not.toHaveBeenCalled();
  });

  it('should not execute action when loading', () => {
    const mockAction = {
      label: 'Test Action',
      loading: true,
      onClick: jasmine.createSpy('onClick')
    };
    component.executeAction(mockAction);
    expect(mockAction.onClick).not.toHaveBeenCalled();
  });

  it('should handle multiple selection mode', () => {
    component.selectionMode = 'multiple';
    component.columns = [
      { field: 'name', header: 'Name' },
      { field: 'email', header: 'Email' }
    ];
    fixture.detectChanges();
    expect(component.selectionMode).toBe('multiple');
  });

  it('should handle single selection mode', () => {
    component.selectionMode = 'single';
    fixture.detectChanges();
    expect(component.selectionMode).toBe('single');
  });

  it('should display empty message when no data', () => {
    component.data = [];
    component.emptyMessage = 'No data available';
    fixture.detectChanges();
    expect(component.emptyMessage).toBe('No data available');
  });
});
