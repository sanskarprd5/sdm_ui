import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

interface KpiCard {
  id?: string;
  count: number;
  label: string;
  icon: string;
  bgColor: string;
  iconColor: string;
}

@Component({
  selector: 'app-kpi-widgets',
  imports: [CommonModule, CardModule],
  templateUrl: './kpi-widgets.component.html',
  styleUrl: './kpi-widgets.component.scss'
})
export class KpiWidgetsComponent {
  @Input() kpiCards: KpiCard[] = [];
  @Input() activeCardIndex: number = 0;
  @Output() cardSelected = new EventEmitter<{ index: number; kpiId: string }>();

  setActiveCard(index: number): void {
    this.activeCardIndex = index;
    const selectedKpi = this.kpiCards[index];
    this.cardSelected.emit({ 
      index, 
      kpiId: selectedKpi.id || `kpi-${index}` 
    });
  }

  isCardActive(index: number): boolean {
    return this.activeCardIndex === index;
  }
}
