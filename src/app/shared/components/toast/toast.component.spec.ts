import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';

import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let component: ToastComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start auto-dismiss timer when show becomes true', fakeAsync(() => {
    const dismissSpy = spyOn(component.dismissed, 'emit');
    component.duration = 5;
    component.show = true;

    component.ngOnChanges({ show: new SimpleChange(false, true, false) });
    tick(5);

    expect(dismissSpy).toHaveBeenCalled();
  }));

  it('should not auto-dismiss when show is false', fakeAsync(() => {
    const dismissSpy = spyOn(component.dismissed, 'emit');
    component.show = false;

    component.ngOnChanges({ show: new SimpleChange(true, false, false) });
    tick(10);

    expect(dismissSpy).not.toHaveBeenCalled();
  }));

  it('should emit dismissed when close is triggered manually', () => {
    const dismissSpy = spyOn(component.dismissed, 'emit');

    component.close();

    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should clear timeout in ngOnDestroy', fakeAsync(() => {
    const dismissSpy = spyOn(component.dismissed, 'emit');
    component.duration = 20;
    component.show = true;
    component.ngOnChanges({ show: new SimpleChange(false, true, false) });

    component.ngOnDestroy();
    tick(20);

    expect(dismissSpy).not.toHaveBeenCalled();
  }));

  it('should return icon class for each toast type', () => {
    component.type = 'success';
    expect(component.getIcon()).toBe('pi pi-check-circle');

    component.type = 'error';
    expect(component.getIcon()).toBe('pi pi-times-circle');

    component.type = 'info';
    expect(component.getIcon()).toBe('pi pi-info-circle');

    component.type = 'warning';
    expect(component.getIcon()).toBe('pi pi-exclamation-triangle');

    component.type = 'other' as any;
    expect(component.getIcon()).toBe('pi pi-info-circle');
  });
});
