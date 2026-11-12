import { NgModule } from '@angular/core';

import { CascaderComponent } from './components/cascader/cascader.component';
import { DropdownComponent } from './components/dropdown/dropdown.component';

const DROPDOWN_API = [DropdownComponent, CascaderComponent];

/** Optional module wrapper for NgModule-based applications (all members are standalone). */
@NgModule({
  imports: DROPDOWN_API,
  exports: DROPDOWN_API,
})
export class NgxDropdownModule {}
