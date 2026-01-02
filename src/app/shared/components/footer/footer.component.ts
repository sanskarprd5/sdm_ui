import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit, OnDestroy {
    currentYear: number = new Date().getFullYear();
    currentUTCTime: string = '';
    private timeInterval: any;

    constructor() {}

    ngOnInit() {
        // this.updateUTCTime();
        // Update time every second
        // this.timeInterval = setInterval(() => {
        //     this.updateUTCTime();
        // }, 1000);
    }

    ngOnDestroy() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }

    private updateUTCTime() {
        const now = new Date();
        this.currentUTCTime = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }
}

