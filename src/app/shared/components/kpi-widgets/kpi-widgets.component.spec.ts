import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiWidgetsComponent } from './kpi-widgets.component';

describe('KpiWidgetsComponent', () => {
  let component: KpiWidgetsComponent;
  let fixture: ComponentFixture<KpiWidgetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiWidgetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiWidgetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit card selection with provided id', () => {
    component.kpiCards = [{
      id: 'arrival',
      count: 10,
      label: 'Arrival',
      icon: 'pi pi-plane',
      bgColor: '#fff',
      iconColor: '#000'
    }];
    const emitSpy = spyOn(component.cardSelected, 'emit');

    component.setActiveCard(0);

    expect(component.activeCardIndex).toBe(0);
    expect(emitSpy).toHaveBeenCalledWith({ index: 0, kpiId: 'arrival' });
  });

  it('should fall back to generated id when missing', () => {
    component.kpiCards = [{
      count: 5,
      label: 'Fallback',
      icon: 'pi pi-box',
      bgColor: '#eee',
      iconColor: '#111'
    } as any];
    const emitSpy = spyOn(component.cardSelected, 'emit');

    component.setActiveCard(0);

    expect(emitSpy).toHaveBeenCalledWith({ index: 0, kpiId: 'kpi-0' });
  });

  it('should evaluate card active status', () => {
    component.activeCardIndex = 1;

    expect(component.isCardActive(1)).toBeTrue();
    expect(component.isCardActive(0)).toBeFalse();
  });
});
