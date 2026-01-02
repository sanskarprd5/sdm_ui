import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { MainPanelComponent } from '../../../shared/components/main-panel/main-panel.component';
import { ArrivalService } from '../arrival.service';
import { Shipment } from '../arrival.model';

@Component({
  selector: 'app-shipment-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    ButtonModule,
    MainPanelComponent
  ],
  templateUrl: './shipment-config.component.html',
  styleUrl: './shipment-config.component.scss'
})
export class ShipmentConfigComponent implements OnInit {
  activeTab: string = 'shipment-details';

  // Shipment Details
  shipmentNo: string = '';
  poNo: string = '';
  customerName: string = '';
  sourceSystem: string = '';
  bdpRepresentativeName: string = '';
  modeOfTransport: string = '';
  moveTypeDescription: string = '';
  carrierName: string = '';
  hbl: string = '';
  portOfDeparture: string = '';
  portOfTransit: string = '';
  portOfArrival: string = '';
  placeOfDeliveryUnloc: string = '';
  documentDistributionReceived: string = '';
  atd: Date | null = null;
  eta: Date | null = null;
  predictiveETA: Date | null = null;
  latestEta: Date | null = null;
  ata: Date | null = null;
  carrierReleaseRequest: string = '';
  releaseReceivedFromCarrier: string = '';

  // Additional fields from form
  originCountryName: string = '';
  originCountryCode: string = '';
  portOfDepartureName: string = '';
  portOfDepartureCode: string = '';
  originRegion: string = '';
  portOfDepartureEstimatedDate: Date | null = null;
  portOfDepartureActualDate: Date | null = null;
  destinationCountryName: string = '';
  destinationCountryCode: string = '';
  portOfArrivalName: string = '';
  portOfArrivalCode: string = '';
  destinationRegion: string = '';
  portOfArrivalEstimatedDate: Date | null = null;
  portOfArrivalActualDate: Date | null = null;
  status: string = '';
  typeOfService: string = '';
  vesselName: string = '';
  vesselCode: string = '';

  // Dropdown options
  modeOfTransportOptions = [
    { label: 'Ocean', value: 'OCEAN' },
    { label: 'Air', value: 'AIR' },
    { label: 'Rail', value: 'RAIL' },
    { label: 'Truck', value: 'TRUCK' }
  ];

  statusOptions = [
    { label: 'Incomplete Documents', value: 'INCOMPLETE' },
    { label: 'Arriving', value: 'ARRIVING' },
    { label: 'Shipment Early', value: 'EARLY' },
    { label: 'Arrived', value: 'ARRIVED' },
    { label: 'In Transit', value: 'IN_TRANSIT' }
  ];

  typeOfServiceOptions = [
    { label: 'Direct', value: 'DIRECT' },
    { label: 'Express', value: 'EXPRESS' },
    { label: 'Standard', value: 'STANDARD' },
    { label: 'Economy', value: 'ECONOMY' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private arrivalService: ArrivalService
  ) {}

  ngOnInit(): void {
    // Try to get shipment from sessionStorage first
    const shipmentData = sessionStorage.getItem('selectedShipmentNo');
    console.log('Shipment Info from sessionStorage:', shipmentData);
    
    if (shipmentData) {
      try {
        const shipment = JSON.parse(shipmentData);
        console.log('Parsed shipment data:', shipment);
        this.populateFormFromShipment(shipment);
        // Clear sessionStorage after use
        sessionStorage.removeItem('selectedShipmentNo');
        return;
      } catch (error) {
        console.error('Failed to parse shipment data from sessionStorage:', error);
      }
    }

    // Fallback: Get shipment number from route parameter and load from API
    this.route.params.subscribe(params => {
      this.shipmentNo = params['shipmentNo'] || '';
      if (this.shipmentNo) {
        this.loadShipmentDetails(this.shipmentNo);
      }
    });
  }

  loadShipmentDetails(shipmentNo: string): void {
    // Fetch all shipments and find the matching one
    // Using statusId 102 (Arriving) as default - adjust based on your needs
    const request = {
      statusId: 102,
      status: 'ARRIVING',
      page: 0,
      size: 100
    };

    this.arrivalService.getArrivalShipments(request).subscribe({
      next: (result) => {
        const shipment = result.shipments.find(s => s.shipmentNo === shipmentNo);
        if (shipment) {
          this.populateFormFromShipment(shipment);
        } else {
          console.warn('Shipment not found:', shipmentNo);
        }
      },
      error: (error) => {
        console.error('Error loading shipment details:', error);
      }
    });
  }

  populateFormFromShipment(shipment: Shipment): void {
    // Map shipment data to form fields
    this.shipmentNo = shipment.shipmentNo || '';
    this.poNo = shipment.poNo || '';
    this.customerName = shipment.customerName || '';
    this.sourceSystem = shipment.sourceSystem || '';
    this.bdpRepresentativeName = shipment.bdpRepresentativeName || '';
    this.modeOfTransport = this.normalizeTransportMode(shipment.modeOfTransport || 'OCEAN');
    this.moveTypeDescription = shipment.moveTypeDescription || '';
    this.carrierName = shipment.carrierName || '';
    this.hbl = shipment.hbl || '';
    this.portOfDeparture = shipment.portOfDeparture || '';
    this.portOfTransit = shipment.portOfTransit || '';
    this.portOfArrival = shipment.portOfArrival || '';
    this.placeOfDeliveryUnloc = shipment.placeOfDeliveryUnloc || '';
    this.documentDistributionReceived = shipment.documentDistributionReceived || '';
    this.carrierReleaseRequest = shipment.carrierReleaseRequest || '';
    this.releaseReceivedFromCarrier = shipment.releaseReceivedFromCarrier || '';

    // Parse date fields
    this.atd = this.parseDate(shipment.atd);
    this.eta = this.parseDate(shipment.eta);
    this.predictiveETA = this.parseDate(shipment.predictiveETA);
    this.latestEta = this.parseDate(shipment.latestEta);
    this.ata = this.parseDate(shipment.ata);

    // For now, set these to the mapped values or defaults
    // These can be enhanced when more detailed API is available
    this.portOfDepartureName = shipment.portOfDeparture || '';
    this.portOfArrivalName = shipment.portOfArrival || '';
    this.portOfDepartureEstimatedDate = this.atd;
    this.portOfArrivalEstimatedDate = this.eta;
    this.portOfArrivalActualDate = this.ata;
  }

  normalizeTransportMode(mode: string): string {
    const normalized = mode.toUpperCase().trim();
    if (normalized.includes('OCEAN') || normalized.includes('SEA')) return 'OCEAN';
    if (normalized.includes('AIR')) return 'AIR';
    if (normalized.includes('RAIL')) return 'RAIL';
    if (normalized.includes('TRUCK') || normalized.includes('ROAD')) return 'TRUCK';
    return mode;
  }

  parseDate(dateString: string | undefined | null): Date | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onCancel(): void {
    this.router.navigate(['/arrival']);
  }

  onSave(): void {
    console.log('Saving shipment configuration...');
    // TODO: Implement save logic
    this.router.navigate(['/arrival']);
  }
}
