import { NgModule } from '@angular/core';

import { TableComponent } from './components/table/table.component';
import {
  TableCellDirective,
  TableEmptyDirective,
  TableFilterDirective,
  TableFooterDirective,
  TableHeaderDirective,
  TableRowActionsDirective,
  TableToolbarDirective,
} from './directives/table-template.directives';

const TABLE_API = [
  TableComponent,
  TableCellDirective,
  TableHeaderDirective,
  TableFilterDirective,
  TableRowActionsDirective,
  TableToolbarDirective,
  TableFooterDirective,
  TableEmptyDirective,
];

/** Optional module wrapper for NgModule-based applications (all members are standalone). */
@NgModule({
  imports: TABLE_API,
  exports: TABLE_API,
})
export class NgxTableModule {}
