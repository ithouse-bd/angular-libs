import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ThemeInitializer } from './theme-initializer.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ThemeInitializer],
})
export class AppComponent {
  title = 'demo-app';
  readonly theme = inject(ThemeInitializer);
  readonly currentTheme = this.theme.currentTheme;

  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.theme.setTheme(theme);
  }
}
