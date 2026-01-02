# Model-Driven Architecture Pattern

## Overview
This document describes the centralized model-driven architecture pattern used across all feature modules in the Smart Destination Management application.

## Pattern Structure

### 1. Model File Organization
Each feature module should have a dedicated `.model.ts` file containing:
- Data interfaces
- KPI configuration
- Table column definitions
- Helper functions

**Example:**
```
src/app/
  pages/
    arrival/
      arrival.model.ts          ← Centralized configuration
      arrival/
        arrival.component.ts
        arrival.component.html
        arrival.component.scss
  module/
    carrier-release/
      carrier-release.model.ts  ← Centralized configuration
      carrier-release.component.ts
```

### 2. Model File Structure

#### A. Data Interfaces
Define the shape of your data:

```typescript
export interface Shipment {
  shipmentNo: string;
  poNo: string;
  customerName: string;
  // ... other fields
}
```

#### B. KPI Configuration
Define KPI cards with associated table columns:

```typescript
export interface KpiCard {
  id: string;                    // Unique identifier
  count: number;                 // Display count
  label: string;                 // Display label
  icon: string;                  // PrimeNG icon class
  bgColor: string;               // Background color
  iconColor: string;             // Icon overlay color
  associatedColumns: string[];   // Column fields to show when KPI is active
}

export const ARRIVAL_KPI_CONFIG: KpiCard[] = [
  {
    id: 'shipments-arriving',
    count: 88,
    label: 'Shipments Arriving',
    icon: 'pi pi-box',
    bgColor: '#2196F3',
    iconColor: 'rgba(255, 255, 255, 0.3)',
    associatedColumns: ['shipmentNo', 'poNo', 'customerName', 'sourceSystem']
  },
  // ... more KPIs
];
```

#### C. Table Column Configuration
Define all available columns for the module:

```typescript
export interface TableColumn {
  field: string;                 // Data field name
  header: string;                // Display header
  sortable: boolean;             // Enable sorting
  filter: boolean;               // Enable filtering
  width?: string;                // Optional column width
  type?: 'text' | 'link' | 'badge' | 'date' | 'custom';
}

export const ALL_ARRIVAL_COLUMNS: TableColumn[] = [
  {
    field: 'shipmentNo',
    header: 'Shipment No.',
    sortable: true,
    filter: true,
    type: 'link'
  },
  // ... all possible columns
];
```

#### D. Helper Functions
Provide utility functions for column retrieval:

```typescript
export function getColumnsByFields(fields: string[]): TableColumn[] {
  return ALL_ARRIVAL_COLUMNS.filter(col => fields.includes(col.field));
}

export function getColumnsForKpi(kpiId: string): TableColumn[] {
  const kpi = ARRIVAL_KPI_CONFIG.find(k => k.id === kpiId);
  if (!kpi) {
    return getColumnsByFields(ARRIVAL_KPI_CONFIG[0].associatedColumns);
  }
  return getColumnsByFields(kpi.associatedColumns);
}
```

### 3. Component Implementation

#### A. Import Model Configuration
```typescript
import { 
  Shipment, 
  KpiCard, 
  TableColumn, 
  ARRIVAL_KPI_CONFIG, 
  getColumnsForKpi 
} from '../arrival.model';
```

#### B. Component Properties
```typescript
export class ArrivalComponent implements OnInit {
  // Data
  shipments: Shipment[] = [];
  
  // KPI Configuration
  kpiCards: KpiCard[] = ARRIVAL_KPI_CONFIG;
  activeKpiId: string = ARRIVAL_KPI_CONFIG[0].id;
  
  // Dynamic table headers
  tableHeaders: TableColumn[] = [];
  
  ngOnInit(): void {
    this.updateTableColumns();
    this.loadShipments();
  }
  
  updateTableColumns(): void {
    this.tableHeaders = getColumnsForKpi(this.activeKpiId);
  }
  
  onKpiSelected(kpiId: string): void {
    this.activeKpiId = kpiId;
    this.updateTableColumns();
    this.loadShipments(); // Optionally reload data
  }
}
```

#### C. Template Binding
```html
<!-- Pass KPI config and handle selection -->
<app-kpi-widgets 
  [kpiCards]="kpiCards"
  [activeCardIndex]="0"
  (cardSelected)="onKpiSelected($event.kpiId)">
</app-kpi-widgets>

<!-- Dynamic table columns -->
<ng-template pTemplate="header">
  <tr>
    <th style="width: 3rem">
      <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
    </th>
    @for (col of tableHeaders; track col.field) {
      <th [pSortableColumn]="col.sortable ? col.field : undefined">
        {{ col.header }}
      </th>
    }
  </tr>
</ng-template>

<!-- Dynamic table body -->
<ng-template pTemplate="body" let-item>
  <tr>
    <td>
      <p-tableCheckbox [value]="item"></p-tableCheckbox>
    </td>
    @for (col of tableHeaders; track col.field) {
      <td>
        @if (col.type === 'link') {
          <a [href]="'#'">{{ item[col.field] }}</a>
        } @else {
          {{ item[col.field] }}
        }
      </td>
    }
  </tr>
</ng-template>
```

### 4. KPI Widget Component

The `KpiWidgetsComponent` should accept configuration and emit events:

```typescript
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
}
```

## Benefits

1. **Centralized Configuration**: All KPI and column definitions in one place
2. **Type Safety**: Strong typing for data structures and configurations
3. **Maintainability**: Easy to add/remove columns or KPIs
4. **Reusability**: Helper functions reduce code duplication
5. **Consistency**: Standardized pattern across all modules
6. **Dynamic UI**: Table columns change based on KPI selection
7. **Scalability**: Easy to extend with new KPIs or data fields

## Usage Checklist

When creating a new feature module:

- [ ] Create `<feature>.model.ts` file
- [ ] Define data interfaces
- [ ] Configure KPI cards with `associatedColumns`
- [ ] Define all possible table columns
- [ ] Implement helper functions
- [ ] Import model in component
- [ ] Use `getColumnsForKpi()` for dynamic columns
- [ ] Pass KPI config to widgets component
- [ ] Handle `cardSelected` event
- [ ] Update table template to use dynamic columns

## Example Modules

- **Arrival**: `src/app/pages/arrival/arrival.model.ts`
- **Carrier Release**: `src/app/module/carrier-release/carrier-release.model.ts`

## Future Enhancements

- [ ] Add column visibility persistence (localStorage)
- [ ] Implement drag-and-drop column reordering
- [ ] Add custom column formatters
- [ ] Support for nested/grouped columns
- [ ] Export column configuration as JSON
