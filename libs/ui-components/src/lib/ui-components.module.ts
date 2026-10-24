import { NgModule } from '@angular/core';
import { CardComponent } from './card.component';
import { ButtonComponent } from './button.component';

@NgModule({
  imports: [CardComponent, ButtonComponent],
  exports: [CardComponent, ButtonComponent],
})
export class UiComponentsModule {}
