import { Component, Input } from '@angular/core';

@Component({
  selector: 'lib-card',
  standalone: true,
  template: `
    <div class="tw-bg-white tw-shadow-lg tw-rounded-lg tw-overflow-hidden tw-border tw-border-gray-200">
      <div class="tw-px-6 tw-py-4">
        <div class="tw-font-bold tw-text-xl tw-mb-2">{{ title }}</div>
        <p class="tw-text-gray-700 tw-text-base">
          <ng-content></ng-content>
        </p>
      </div>
      @if (footer) {
        <div class="tw-px-6 tw-py-4 tw-bg-gray-50">
          {{ footer }}
        </div>
      }
    </div>
  `,
  styles: []
})
export class CardComponent {
  @Input() title: string = '';
  @Input() footer?: string;
}
