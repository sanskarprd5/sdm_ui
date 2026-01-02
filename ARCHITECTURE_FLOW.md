# Architecture Flow Diagram

## Component Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     arrival.model.ts                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ARRIVAL_KPI_CONFIG                                       │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ { id: 'shipments-arriving',                        │  │  │
│  │  │   associatedColumns: ['shipmentNo', 'poNo', ...] } │  │  │
│  │  │ { id: 'incomplete-documents',                      │  │  │
│  │  │   associatedColumns: ['shipmentNo', 'missing...'] }│  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ALL_ARRIVAL_COLUMNS                                      │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ [{ field: 'shipmentNo', header: '...', ...},       │  │  │
│  │  │  { field: 'poNo', ...},                            │  │  │
│  │  │  { field: 'missingDocuments', ...}, ...]           │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  Helper: getColumnsForKpi(kpiId) ──────────────────────┐  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Import
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   arrival.component.ts                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Properties:                                              │  │
│  │  • kpiCards = ARRIVAL_KPI_CONFIG                         │  │
│  │  • activeKpiId = 'shipments-arriving'                    │  │
│  │  • tableHeaders: TableColumn[] = []                      │  │
│  │                                                            │  │
│  │  Methods:                                                 │  │
│  │  • ngOnInit() {                                          │  │
│  │      this.updateTableColumns()  ──┐                      │  │
│  │    }                               │                      │  │
│  │                                    ▼                      │  │
│  │  • updateTableColumns() {                                │  │
│  │      this.tableHeaders = getColumnsForKpi(activeKpiId)   │  │
│  │    }                                                      │  │
│  │                                    ▲                      │  │
│  │  • onKpiSelected(kpiId) {         │                      │  │
│  │      this.activeKpiId = kpiId     │                      │  │
│  │      this.updateTableColumns() ───┘                      │  │
│  │    }                                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Template Binding
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  arrival.component.html                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  <app-kpi-widgets                                         │  │
│  │    [kpiCards]="kpiCards"                                 │  │
│  │    (cardSelected)="onKpiSelected($event.kpiId)">         │  │
│  │  </app-kpi-widgets>                                      │  │
│  │                                                            │  │
│  │  <p-table [value]="shipments">                           │  │
│  │    <ng-template pTemplate="header">                      │  │
│  │      @for (col of tableHeaders; track col.field) {       │  │
│  │        <th>{{ col.header }}</th>                         │  │
│  │      }                                                    │  │
│  │    </ng-template>                                        │  │
│  │    <ng-template pTemplate="body" let-shipment>           │  │
│  │      @for (col of tableHeaders; track col.field) {       │  │
│  │        <td>{{ shipment[col.field] }}</td>                │  │
│  │      }                                                    │  │
│  │    </ng-template>                                        │  │
│  │  </p-table>                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ User Interaction
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  kpi-widgets.component.ts                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  @Input() kpiCards: KpiCard[]                            │  │
│  │  @Output() cardSelected = EventEmitter()                 │  │
│  │                                                            │  │
│  │  setActiveCard(index: number) {                          │  │
│  │    this.activeCardIndex = index                          │  │
│  │    this.cardSelected.emit({                              │  │
│  │      index,                                              │  │
│  │      kpiId: this.kpiCards[index].id                      │  │
│  │    })                                                     │  │
│  │  }                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow on KPI Selection

```
User clicks KPI Card "Incomplete Documents"
           │
           ▼
┌──────────────────────────────────────┐
│ kpi-widgets.component emits:         │
│ { index: 1, kpiId: 'incomplete-doc'} │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ arrival.component receives event     │
│ onKpiSelected('incomplete-doc')      │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ activeKpiId = 'incomplete-doc'       │
│ updateTableColumns() called          │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ getColumnsForKpi('incomplete-doc')   │
│ Returns columns:                     │
│ ['shipmentNo', 'missingDocuments',   │
│  'transportMode', 'source',          │
│  'originalETA', 'predictiveETA']     │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ tableHeaders updated                 │
│ Template re-renders with new columns │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ User sees table with 6 columns       │
│ specific to Incomplete Documents KPI │
└──────────────────────────────────────┘
```

## Column Configuration Mapping

```
KPI: Shipments Arriving (id: 'shipments-arriving')
     │
     ├─> associatedColumns: 
     │   ['shipmentNo', 'poNo', 'customerName', 
     │    'sourceSystem', 'bdpRepresentativeName', 'modeOfTransport']
     │
     └─> getColumnsForKpi() finds matching columns from ALL_ARRIVAL_COLUMNS:
         [
           { field: 'shipmentNo', header: 'Shipment No.', type: 'link' },
           { field: 'poNo', header: 'PO No.', type: 'text' },
           { field: 'customerName', header: 'Customer Name', type: 'text' },
           { field: 'sourceSystem', header: 'Source System', type: 'text' },
           { field: 'bdpRepresentativeName', header: 'BDP Rep...', type: 'text' },
           { field: 'modeOfTransport', header: 'Mode of Transport', type: 'text' }
         ]

KPI: Incomplete Documents (id: 'incomplete-documents')
     │
     ├─> associatedColumns:
     │   ['shipmentNo', 'missingDocuments', 'transportMode',
     │    'source', 'originalETA', 'predictiveETA']
     │
     └─> getColumnsForKpi() finds matching columns from ALL_ARRIVAL_COLUMNS:
         [
           { field: 'shipmentNo', header: 'Shipment No.', type: 'link' },
           { field: 'missingDocuments', header: 'Missing Docs', type: 'link' },
           { field: 'transportMode', header: 'Transport Mode', type: 'text' },
           { field: 'source', header: 'Source', type: 'text' },
           { field: 'originalETA', header: 'Original ETA', type: 'date' },
           { field: 'predictiveETA', header: 'Predictive ETA', type: 'date' }
         ]
```

## Benefits Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                        BEFORE                                   │
├─────────────────────────────────────────────────────────────────┤
│  Component A           Component B           Component C        │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │ Hardcoded    │     │ Hardcoded    │     │ Hardcoded    │   │
│  │ KPIs         │     │ KPIs         │     │ KPIs         │   │
│  │ Hardcoded    │     │ Hardcoded    │     │ Hardcoded    │   │
│  │ Columns      │     │ Columns      │     │ Columns      │   │
│  │ Static Table │     │ Static Table │     │ Static Table │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│                                                                  │
│  ❌ Duplication        ❌ Hard to maintain  ❌ Not scalable     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        AFTER                                    │
├─────────────────────────────────────────────────────────────────┤
│                     ┌──────────────────┐                        │
│                     │  arrival.model   │                        │
│                     │  ┌────────────┐  │                        │
│                     │  │ KPI Config │  │                        │
│                     │  │ Columns    │  │                        │
│                     │  │ Helpers    │  │                        │
│                     │  └────────────┘  │                        │
│                     └────────┬─────────┘                        │
│                              │                                   │
│              ┌───────────────┼───────────────┐                 │
│              │               │               │                  │
│         Component A     Component B     Component C             │
│         ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│         │ Import   │   │ Import   │   │ Import   │            │
│         │ Config   │   │ Config   │   │ Config   │            │
│         │ Dynamic  │   │ Dynamic  │   │ Dynamic  │            │
│         │ Columns  │   │ Columns  │   │ Columns  │            │
│         └──────────┘   └──────────┘   └──────────┘            │
│                                                                  │
│  ✅ Single Source       ✅ Easy to update   ✅ Scalable        │
└─────────────────────────────────────────────────────────────────┘
```
