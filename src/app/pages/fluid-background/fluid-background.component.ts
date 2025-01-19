import { Component, ElementRef, ViewChild} from '@angular/core';
import { FluidSimulationService } from '../../services/three.service';

@Component({
  selector: 'app-fluid-background',
  imports: [],
  templateUrl: './fluid-background.component.html',
  styleUrl: './fluid-background.component.scss'
})
export class FluidBackgroundComponent {
  @ViewChild('canvas') private canvas!: ElementRef<HTMLCanvasElement>;

  constructor(private fluidService: FluidSimulationService) {}

  ngAfterViewInit() {
    this.fluidService.initialize(this.canvas);
  }

  ngOnDestroy() {
    this.fluidService.ngOnDestroy();
  }
}
