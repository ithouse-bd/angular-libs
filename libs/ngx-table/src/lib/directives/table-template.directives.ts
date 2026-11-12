import { Directive, TemplateRef, input } from '@angular/core';

import {
  TableCellContext,
  TableFilterContext,
  TableFooterContext,
  TableHeaderContext,
  TableRowActionsContext,
  TableToolbarContext,
} from '../models/table.models';

/**
 * Custom cell renderer.
 *
 * ```html
 * <ng-template ithTableCell="status" let-row let-value="value">
 *   <span class="badge">{{ value }}</span>
 * </ng-template>
 * ```
 */
@Directive({ selector: '[ithTableCell]' })
export class TableCellDirective {
  /** `key` of the column this template renders. */
  readonly columnKey = input.required<string>({ alias: 'ithTableCell' });
  constructor(readonly template: TemplateRef<TableCellContext>) {}
}

/** Custom header renderer for one column: `#ithTableHeader="key"`. */
@Directive({ selector: '[ithTableHeader]' })
export class TableHeaderDirective {
  readonly columnKey = input.required<string>({ alias: 'ithTableHeader' });
  constructor(readonly template: TemplateRef<TableHeaderContext>) {}
}

/** Custom filter control for one column: `#ithTableFilter="key"`. */
@Directive({ selector: '[ithTableFilter]' })
export class TableFilterDirective {
  readonly columnKey = input.required<string>({ alias: 'ithTableFilter' });
  constructor(readonly template: TemplateRef<TableFilterContext>) {}
}

/** Replaces the buttons of the actions column: `#ithTableRowActions`. */
@Directive({ selector: '[ithTableRowActions]' })
export class TableRowActionsDirective {
  constructor(readonly template: TemplateRef<TableRowActionsContext>) {}
}

/** Replaces the toolbar content next to the title: `#ithTableToolbar`. */
@Directive({ selector: '[ithTableToolbar]' })
export class TableToolbarDirective {
  constructor(readonly template: TemplateRef<TableToolbarContext>) {}
}

/** Replaces the footer summary: `#ithTableFooter`. */
@Directive({ selector: '[ithTableFooter]' })
export class TableFooterDirective {
  constructor(readonly template: TemplateRef<TableFooterContext>) {}
}

/** Custom empty state: `#ithTableEmpty`. */
@Directive({ selector: '[ithTableEmpty]' })
export class TableEmptyDirective {
  constructor(readonly template: TemplateRef<TableToolbarContext>) {}
}
