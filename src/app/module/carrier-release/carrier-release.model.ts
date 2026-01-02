/**
 * Carrier Release Module Data Models and Configuration
 * Centralized definitions for KPIs, table columns, and data structures
 */

// ============= Data Interfaces =============

export interface CarrierRelease {
  shipmentNo: string;
  containerNo?: string;
  carrier?: string;
  releaseStatus?: string;
  releaseDate?: string;
  portOfDischarge?: string;
  customerName?: string;
  [key: string]: any; // Allow additional dynamic fields
}

// ============= KPI Configuration =============

export interface KpiCard {
  id: string;
  count: number;
  label: string;
  icon: string;
  bgColor: string;
  iconColor: string;
  associatedColumns: string[]; // Column fields to show when this KPI is active
}

export const CARRIER_RELEASE_KPI_CONFIG: KpiCard[] = [
  {
    id: 'pending-releases',
    count: 45,
    label: 'Pending Releases',
    icon: 'pi pi-clock',
    bgColor: '#2196F3',
    iconColor: 'rgba(255, 255, 255, 0.3)',
    associatedColumns: ['shipmentNo', 'containerNo', 'carrier', 'releaseStatus', 'customerName']
  },
  {
    id: 'released-today',
    count: 12,
    label: 'Released Today',
    icon: 'pi pi-check-circle',
    bgColor: '#FFFFFF',
    iconColor: 'rgba(33, 150, 243, 0.2)',
    associatedColumns: ['shipmentNo', 'containerNo', 'releaseDate', 'portOfDischarge', 'customerName']
  },
  {
    id: 'awaiting-documents',
    count: 8,
    label: 'Awaiting Documents',
    icon: 'pi pi-file',
    bgColor: '#FFFFFF',
    iconColor: 'rgba(33, 150, 243, 0.2)',
    associatedColumns: ['shipmentNo', 'containerNo', 'carrier', 'releaseStatus', 'customerName']
  }
];

// ============= Table Column Configuration =============

export interface TableColumn {
  field: string;
  header: string;
  sortable: boolean;
  filter: boolean;
  width?: string;
  type?: 'text' | 'link' | 'badge' | 'date' | 'custom';
}

// All available columns for the carrier release module
export const ALL_CARRIER_RELEASE_COLUMNS: TableColumn[] = [
  {
    field: 'shipmentNo',
    header: 'Shipment No.',
    sortable: true,
    filter: true,
    type: 'link'
  },
  {
    field: 'containerNo',
    header: 'Container No.',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'carrier',
    header: 'Carrier',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'releaseStatus',
    header: 'Release Status',
    sortable: true,
    filter: true,
    type: 'badge'
  },
  {
    field: 'releaseDate',
    header: 'Release Date',
    sortable: true,
    filter: true,
    type: 'date'
  },
  {
    field: 'portOfDischarge',
    header: 'Port of Discharge',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'customerName',
    header: 'Customer Name',
    sortable: true,
    filter: true,
    type: 'text'
  }
];

// Helper function to get columns by field names
export function getColumnsByFields(fields: string[]): TableColumn[] {
  return ALL_CARRIER_RELEASE_COLUMNS.filter(col => fields.includes(col.field));
}

// Helper function to get active columns based on KPI selection
export function getColumnsForKpi(kpiId: string): TableColumn[] {
  const kpi = CARRIER_RELEASE_KPI_CONFIG.find(k => k.id === kpiId);
  if (!kpi) {
    return getColumnsByFields(CARRIER_RELEASE_KPI_CONFIG[0].associatedColumns);
  }
  return getColumnsByFields(kpi.associatedColumns);
}
