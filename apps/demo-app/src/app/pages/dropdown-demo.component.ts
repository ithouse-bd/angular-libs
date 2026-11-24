import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DropdownComponent, DropdownOption } from '@ithouse-bd/ngx-dropdown';
import { UiComponentsModule } from '@tailwind-bootstrap/ui-components';

@Component({
  selector: 'app-dropdown-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DropdownComponent, UiComponentsModule],
  templateUrl: './dropdown-demo.component.html',
})
export class DropdownDemoComponent {
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

  onSelectionChange(event: unknown): void {
    console.log('Selection changed:', event);
  }

  onMultiSelectionChange(event: unknown): void {
    console.log('Multi selection changed:', event);
  }
}
