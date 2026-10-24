import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UiComponentsModule } from '@tailwind-bootstrap/ui-components';
import { NgxDropdownModule } from '@ithouse/ngx-dropdown';

import { AppComponent } from './app.component';

@NgModule({
  // AppComponent is standalone, so it is imported (not declared).
  // The app actually bootstraps through `bootstrapApplication` in main.ts;
  // this module is kept for reference for module-based consumers.
  imports: [BrowserModule, AppComponent, UiComponentsModule, NgxDropdownModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
