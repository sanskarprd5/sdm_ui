/**
 * Arrival Module Data Models and Configuration
 * Centralized definitions for KPIs, table columns, and data structures
 */

import { StatusCount } from './arrival.service';

// ============= Data Interfaces =============

export interface MissingDocument {
  name: string;
  document: string | null;
  uploaded: boolean;
}

export interface Shipment {
  shipmentId?: number;
  shipmentNo: string;
  poNo: string;
  customerName: string;
  sourceSystem: string;
  bdpRepresentativeName: string;
  modeOfTransport: string;
  moveTypeDescription?: string;
  carrierName?: string;
  hbl?: string;
  portOfDeparture?: string;
  portOfTransit?: string;
  portOfArrival?: string;
  placeOfDeliveryUnloc?: string;
  documentDistributionReceived?: string;
  atd?: string;
  eta?: string;
  predictiveETA?: string;
  latestEta?: string;
  ata?: string;
  carrierReleaseRequest?: string;
  releaseReceivedFromCarrier?: string;
  missingDocuments?: string;
  missingDocumentsList?: MissingDocument[];
  transportMode?: string;
  source?: string;
  originalETA?: string;
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

export const ARRIVAL_KPI_CONFIG: KpiCard[] = [
  {
    id: 'shipments-arriving',
    count: 88,
    label: 'Shipments Arriving',
    icon: 'pi pi-box',
    bgColor: '#2196F3',
    iconColor: 'rgba(255, 255, 255, 0.3)',
    associatedColumns: ['shipmentNo', 'poNo', 'customerName', 'sourceSystem', 'bdpRepresentativeName', 'modeOfTransport', 'moveTypeDescription', 'carrierName', 'hbl', 'portOfDeparture', 'portOfTransit', 'portOfArrival', 'placeOfDeliveryUnloc', 'documentDistributionReceived', 'atd', 'eta', 'predictiveETA', 'latestEta', 'ata', 'carrierReleaseRequest', 'releaseReceivedFromCarrier']
  },
  {
    id: 'incomplete-documents',
    count: 23,
    label: 'Incomplete Documents',
    icon: 'pi pi-file',
    bgColor: '#FFFFFF',
    iconColor: 'rgba(33, 150, 243, 0.2)',
    associatedColumns: ['shipmentNo', 'poNo', 'customerName', 'sourceSystem', 'bdpRepresentativeName', 'modeOfTransport', 'missingDocuments', 'moveTypeDescription', 'carrierName', 'hbl', 'portOfDeparture', 'portOfTransit', 'portOfArrival', 'placeOfDeliveryUnloc', 'documentDistributionReceived', 'atd', 'eta', 'predictiveETA', 'latestEta', 'ata', 'carrierReleaseRequest', 'releaseReceivedFromCarrier']
  },
  {
    id: 'shipments-late',
    count: 20,
    label: 'Shipments Late',
    icon: 'pi pi-clock',
    bgColor: '#FFFFFF',
    iconColor: 'rgba(33, 150, 243, 0.2)',
    associatedColumns: ['shipmentNo', 'poNo', 'customerName', 'sourceSystem', 'bdpRepresentativeName', 'modeOfTransport', 'moveTypeDescription', 'carrierName', 'hbl', 'portOfDeparture', 'portOfTransit', 'portOfArrival', 'placeOfDeliveryUnloc', 'documentDistributionReceived', 'atd', 'eta', 'predictiveETA', 'latestEta', 'ata', 'carrierReleaseRequest', 'releaseReceivedFromCarrier']
  },
  {
    id: 'shipments-early',
    count: 36,
    label: 'Shipments Early',
    icon: 'pi pi-history',
    bgColor: '#FFFFFF',
    iconColor: 'rgba(33, 150, 243, 0.2)',
    associatedColumns: ['shipmentNo', 'poNo', 'customerName', 'sourceSystem', 'bdpRepresentativeName', 'modeOfTransport', 'moveTypeDescription', 'carrierName', 'hbl', 'portOfDeparture', 'portOfTransit', 'portOfArrival', 'placeOfDeliveryUnloc', 'documentDistributionReceived', 'atd', 'eta', 'predictiveETA', 'latestEta', 'ata', 'carrierReleaseRequest', 'releaseReceivedFromCarrier']
  },
  {
    id: 'shipments-arrived',
    count: 10,
    label: 'Shipments Arrived',
    icon: 'pi pi-map-marker',
    bgColor: '#FFFFFF',
    iconColor: 'rgba(33, 150, 243, 0.2)',
    associatedColumns: ['shipmentNo', 'poNo', 'customerName', 'sourceSystem', 'bdpRepresentativeName', 'modeOfTransport', 'moveTypeDescription', 'carrierName', 'hbl', 'portOfDeparture', 'portOfTransit', 'portOfArrival', 'placeOfDeliveryUnloc', 'documentDistributionReceived', 'atd', 'eta', 'predictiveETA', 'latestEta', 'ata', 'carrierReleaseRequest', 'releaseReceivedFromCarrier']
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

// All available columns for the arrival module
export const ALL_ARRIVAL_COLUMNS: TableColumn[] = [
  {
    field: 'shipmentNo',
    header: 'Shipment No.',
    sortable: true,
    filter: true,
    type: 'link'
  },
  {
    field: 'poNo',
    header: 'PO No.',
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
  },
  {
    field: 'sourceSystem',
    header: 'Source System',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'bdpRepresentativeName',
    header: 'BDP Representative Name',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'modeOfTransport',
    header: 'Mode of Transport',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'missingDocuments',
    header: 'Missing Documents',
    sortable: true,
    filter: true,
    type: 'link'
  },
  {
    field: 'moveTypeDescription',
    header: 'Move Type Description',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'carrierName',
    header: 'Carrier Name',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'hbl',
    header: 'HBL',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'portOfDeparture',
    header: 'Port Of Departure',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'portOfTransit',
    header: 'Port Of Transit',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'portOfArrival',
    header: 'Port Of Arrival',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'placeOfDeliveryUnloc',
    header: 'Place of Delivery UNLOC',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'documentDistributionReceived',
    header: 'Document Distribution Received',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'atd',
    header: 'ATD',
    sortable: true,
    filter: true,
    type: 'date'
  },
  {
    field: 'eta',
    header: 'ETA',
    sortable: true,
    filter: true,
    type: 'date'
  },
  {
    field: 'predictiveETA',
    header: 'Predictive ETA',
    sortable: true,
    filter: true,
    type: 'date'
  },
  {
    field: 'latestEta',
    header: 'Latest ETA',
    sortable: true,
    filter: true,
    type: 'date'
  },
  {
    field: 'ata',
    header: 'ATA',
    sortable: true,
    filter: true,
    type: 'date'
  },
  {
    field: 'carrierReleaseRequest',
    header: 'Carrier Release Request',
    sortable: true,
    filter: true,
    type: 'text'
  },
  {
    field: 'releaseReceivedFromCarrier',
    header: 'Release Received From Carrier',
    sortable: true,
    filter: true,
    type: 'text'
  }
];

// Helper function to get columns by field names
export function getColumnsByFields(fields: string[]): TableColumn[] {
  return ALL_ARRIVAL_COLUMNS.filter(col => fields.includes(col.field));
}

// Helper function to get active columns based on KPI selection
export function getColumnsForKpi(kpiId: string): TableColumn[] {
  const kpi = ARRIVAL_KPI_CONFIG.find(k => k.id === kpiId);
  if (!kpi) {
    return getColumnsByFields(ARRIVAL_KPI_CONFIG[0].associatedColumns);
  }
  return getColumnsByFields(kpi.associatedColumns);
}

/**
 * Map API status counts to KPI cards
 * Maps cardId from API to KPI card configuration
 */
export function mapStatusCountsToKpis(statusCounts: StatusCount[]): KpiCard[] {
  const statusToKpiMap: { [key: number]: string } = {
    102: 'shipments-arriving',     // Arriving
    101: 'incomplete-documents',   // Incomplete Document
    104: 'shipments-early',        // Shipment Early
    105: 'shipments-arrived',      // Arrived
    // Note: Shipments Late doesn't have a direct mapping from API
  };

  // Create a copy of the default KPI config
  const updatedKpis = ARRIVAL_KPI_CONFIG.map(kpi => ({ ...kpi }));

  // Update counts from API data
  statusCounts.forEach(status => {
    const idValue = status.cardId ?? status.statusId;
    if (idValue === undefined) return;
    
    const kpiId = statusToKpiMap[idValue];
    if (kpiId) {
      const kpiIndex = updatedKpis.findIndex(k => k.id === kpiId);
      if (kpiIndex !== -1) {
        updatedKpis[kpiIndex].count = status.count;
      }
    }
  });

  return updatedKpis;
}
