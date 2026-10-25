import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeInitializer } from './theme-initializer.service';

import { DropdownOption, DropdownComponent } from '@ithouse-bd/ngx-dropdown';
import { UiComponentsModule } from '@tailwind-bootstrap/ui-components';
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DropdownComponent, UiComponentsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ThemeInitializer]
})
export class AppComponent implements OnInit {
  title = 'demo-app';
  theme = inject(ThemeInitializer);

  basicOptions: DropdownOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
    { value: 'grape', label: 'Grape' },
  ];

  countries: DropdownOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'in', label: 'India' },
    { value: 'bd', label: 'Bangladesh' },
  ];

  groupedOptions: DropdownOption[] = [
    { value: 'ny', label: 'New York', group: 'USA' },
    { value: 'la', label: 'Los Angeles', group: 'USA' },
    { value: 'chicago', label: 'Chicago', group: 'USA' },
    { value: 'london', label: 'London', group: 'UK' },
    { value: 'manchester', label: 'Manchester', group: 'UK' },
    { value: 'edinburgh', label: 'Edinburgh', group: 'UK' },
    { value: 'tokyo', label: 'Tokyo', group: 'Japan' },
    { value: 'osaka', label: 'Osaka', group: 'Japan' },
  ];

  largeOptions: DropdownOption[] = Array.from({ length: 100 }, (_, i) => ({
    value: i + 1,
    label: `Item ${i + 1}`,
  }));

  disabledOptions: DropdownOption[] = [
    { value: 'opt1', label: 'Available Option' },
    { value: 'opt2', label: 'Disabled Option', disabled: true },
    { value: 'opt3', label: 'Another Available Option' },
    { value: 'opt4', label: 'Also Disabled', disabled: true },
  ];

  ngOnInit(): void {
    // Theme is handled by ThemeInitializer; nothing browser-specific here.
  }

  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.theme.setTheme(theme);
  }

  readonly currentTheme = this.theme.currentTheme;

  onSelectionChange(event: any): void {
    console.log('Selection changed:', event);
  }

  onMultiSelectionChange(event: any): void {
    console.log('Multi selection changed:', event);
  }
}
