import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FluidBackgroundComponent } from './pages/fluid-background/fluid-background.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FluidBackgroundComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'fluid-background-app';
}
