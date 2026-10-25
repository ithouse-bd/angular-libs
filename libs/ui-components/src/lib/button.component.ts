import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'lib-button',
  template: `
    <button 
      [type]="type"
      (click)="clicked.emit($event)"
      [class]="buttonClasses">
      <ng-content></ng-content>
    </button>
  `,
  styles: []
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'success' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Output() clicked = new EventEmitter<Event>();

  get buttonClasses(): string {
    const base = 'tw-font-bold tw-rounded focus:tw-outline-none focus:tw-shadow-outline';
    const sizes = {
      sm: 'tw-py-1 tw-px-2 tw-text-sm',
      md: 'tw-py-2 tw-px-4 tw-text-base',
      lg: 'tw-py-3 tw-px-6 tw-text-lg'
    };
    const variants = {
      primary: 'tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white',
      secondary: 'tw-bg-gray-500 hover:tw-bg-gray-700 tw-text-white',
      success: 'tw-bg-green-500 hover:tw-bg-green-700 tw-text-white',
      danger: 'tw-bg-red-500 hover:tw-bg-red-700 tw-text-white'
    };
    return `${base} ${sizes[this.size]} ${variants[this.variant]}`;
  }
}
