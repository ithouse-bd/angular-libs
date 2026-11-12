import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import {
  TableActionEvent,
  TableCellDirective,
  TableColumn,
  TableComponent,
  TableFilterDirective,
  TableRowAction,
  TableRowActionsDirective,
  TableRowEvent,
  TableSort,
} from '@ithouse-bd/ngx-table';
import { DropdownOption, DropdownComponent } from '@ithouse-bd/ngx-dropdown';
import { UiComponentsModule } from '@tailwind-bootstrap/ui-components';

import { ThemeInitializer } from './theme-initializer.service';

type Gender = 'Male' | 'Female';
type StudentStatus = 'Active' | 'Inactive';

interface Student {
  id: number;
  sl: number;
  studentId: string;
  roll: number;
  name: string;
  gender: Gender;
  religion: string;
  fatherName: string;
  motherName: string;
  guardianMobile: string;
  status: StudentStatus;
}

interface ServerUser {
  id: number;
  name: string;
  email: string;
  role: string;
  lastActive: string;
}

const STUDENT_NAMES: Array<[string, Gender, string, string, string, string, StudentStatus]> = [
  ['LAMIA AKTER', 'Female', 'Islam', 'MD SADEK HOSEN', 'MST KAMRUNNAHAR', '01829013476', 'Active'],
  ['JAKIA ISLAM JARA', 'Female', 'Islam', 'MD JAHANGIR ALAM', 'DALI', '01791635295', 'Active'],
  ['SABRINA AKTER SATHI', 'Female', 'Islam', 'MOHAMMED SHAFIQUL ISLAM', 'MIS. AKHI AKTER', '01831258355', 'Inactive'],
  ['ANABIA AFRIN RODELA', 'Female', 'Islam', 'MD RIAJUL ISLAM RIAJ', 'SHEULY AKTER RAKHA', '01733052331', 'Active'],
  ['SABRINA SHAHRIN', 'Female', 'Islam', 'SAYDUR RAHAMAN', 'MST TANIA AKTER', '01916975773', 'Active'],
  ['NUSRAT JAHAN NUFE', 'Female', 'Islam', 'MD NURUZZAMAN', 'ANOWARA AKTER NADIA', '01845753399', 'Active'],
  ['MST LABONI AKTER', 'Female', 'Islam', 'MD AZGAR ALI', 'MST LOVELY BEGUM', '01935003375', 'Inactive'],
  ['MD AMIR HAMJA', 'Male', 'Islam', 'MD SIRAJUL ISLAM', 'SHAILA AKTER', '01920727964', 'Active'],
  ['SETU MANDAL', 'Female', 'Hinduism', 'SATTA RANJAN MANDAL', 'USHA RANI', '01920713727', 'Active'],
  ['ARPITA GHOSH', 'Female', 'Hinduism', 'JOTILAL GHOSH', 'AUNJONA GHOSH', '01765854405', 'Active'],
  ['RIDIMA GHOSH', 'Female', 'Hinduism', 'SONGIT GHOSH', 'BANNA RANI GHOSH', '01926627035', 'Inactive'],
  ['REDWAN HASAN', 'Male', 'Islam', 'MD ABUDL OHAB', 'PARVIN AKTER', '01929711376', 'Active'],
  ['TAMIM IQBAL', 'Male', 'Islam', 'ABDUL RAHIM', 'JEASMIN AKTER', '01912672953', 'Active'],
];

const STUDENTS: Student[] = STUDENT_NAMES.map((row, index) => {
  const [name, gender, religion, fatherName, motherName, guardianMobile, status] = row;
  return {
    id: index + 1,
    sl: index + 1,
    studentId: String(260029 + index),
    roll: [5, 8, 11, 12, 15, 17, 18, 21, 23, 27, 28, 32, 55][index],
    name,
    gender,
    religion,
    fatherName,
    motherName,
    guardianMobile,
    status,
  };
});

const FIRST_NAMES = ['Ayesha', 'Rafiq', 'Nusrat', 'Tanvir', 'Sadia', 'Imran', 'Farhana', 'Shakib'];
const LAST_NAMES = ['Islam', 'Hossain', 'Akter', 'Rahman', 'Chowdhury', 'Karim'];
const ROLES = ['Admin', 'Editor', 'Viewer', 'Manager'];
const ALL_USERS: ServerUser[] = Array.from({ length: 47 }, (_, index) => {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[index % LAST_NAMES.length];
  return {
    id: index + 1,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${index + 1}@ithouse.dev`,
    role: ROLES[index % ROLES.length],
    lastActive: new Date(2026, 9, 25 - (index % 20), 9 + (index % 10), 15).toLocaleDateString(),
  };
});

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DropdownComponent,
    TableComponent,
    TableCellDirective,
    TableFilterDirective,
    TableRowActionsDirective,
    UiComponentsModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ThemeInitializer],
})
export class AppComponent implements OnInit {
  title = 'demo-app';
  theme = inject(ThemeInitializer);

  /* ------------------------------------------------------------------ */
  /* Dropdown demo data                                                  */
  /* ------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------ */
  /* Client-side table demo                                              */
  /* ------------------------------------------------------------------ */

  readonly students = STUDENTS;

  readonly studentColumns: TableColumn<Student>[] = [
    { key: 'sl', header: 'SL', width: '64px', align: 'center' },
    { key: 'studentId', header: 'Student ID', width: '120px', filterPlaceholder: 'ID…' },
    { key: 'roll', header: 'Roll', width: '72px', align: 'center', filterType: 'number' },
    { key: 'name', header: 'Name', minWidth: '190px' },
    {
      key: 'gender',
      header: 'Gender',
      filterType: 'select',
      filterOptions: [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
      ],
    },
    {
      key: 'religion',
      header: 'Religion',
      filterType: 'select',
      filterOptions: [
        { label: 'Islam', value: 'Islam' },
        { label: 'Hinduism', value: 'Hinduism' },
      ],
    },
    { key: 'fatherName', header: "Father's Name", minWidth: '210px', filterable: false },
    { key: 'motherName', header: "Mother's Name", minWidth: '200px', filterable: false },
    { key: 'guardianMobile', header: "Guardian's Mobile" },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      filterType: 'select',
      filterOptions: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
      ],
    },
  ];

  readonly studentActions: TableRowAction<Student>[] = [
    { id: 'view', label: 'View' },
    { id: 'delete', label: 'Delete', class: 'is-danger' },
  ];

  selectedStudents: Student[] = [];
  lastAction = '';
  pageSize = 10;
  studentFilters = true;

  /* ------------------------------------------------------------------ */
  /* Server-side table demo                                             */
  /* ------------------------------------------------------------------ */

  readonly serverColumns: TableColumn<ServerUser>[] = [
    { key: 'id', header: '#', width: '64px', align: 'center', filterType: 'number' },
    { key: 'name', header: 'Name', minWidth: '160px' },
    { key: 'email', header: 'Email', minWidth: '240px' },
    {
      key: 'role',
      header: 'Role',
      filterType: 'select',
      filterOptions: ROLES.map((role) => ({ label: role, value: role })),
    },
    { key: 'lastActive', header: 'Last active' },
  ];

  // The demo uses zoneless change detection, so async state is stored in signals.
  readonly serverRows = signal<ServerUser[]>([]);
  readonly serverTotal = signal(0);
  readonly serverLoading = signal(false);

  readonly serverSearch = signal('');
  readonly serverSort = signal<TableSort | null>({ key: 'id', direction: 'asc' });
  readonly serverPage = signal(1);
  readonly serverPageSize = signal(5);
  readonly serverFilters = signal<Record<string, string>>({});

  private serverTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadServerPage();
  }

  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.theme.setTheme(theme);
  }

  readonly currentTheme = this.theme.currentTheme;

  /* ------------------------------------------------------------------ */
  /* Table handlers                                                      */
  /* ------------------------------------------------------------------ */

  onStudentSelection(selected: Student[]): void {
    this.selectedStudents = selected;
  }

  onStudentClick(event: TableRowEvent<Student>): void {
    this.lastAction = `Row: ${event.row.name}`;
  }

  onStudentAction(event: TableActionEvent<Student>): void {
    this.lastAction = `${event.action.label}: ${event.row.name} (row ${event.index + 1})`;
  }

  onUserAction(user: ServerUser): void {
    this.lastAction = `Open: ${user.name}`;
  }

  onPageSizeChange(value: number | string): void {
    this.pageSize = Number(value);
  }

  onServerSearch(term: string): void {
    this.serverSearch.set(term);
    this.serverPage.set(1);
    this.loadServerPage();
  }

  onServerSort(sort: TableSort | null): void {
    this.serverSort.set(sort);
    this.loadServerPage();
  }

  onServerFilters(filters: Record<string, string>): void {
    this.serverFilters.set(filters);
    this.serverPage.set(1);
    this.loadServerPage();
  }

  onServerPage(page: number): void {
    this.serverPage.set(page);
    this.loadServerPage();
  }

  onServerPageSize(pageSize: number | string): void {
    this.serverPageSize.set(Number(pageSize));
    this.serverPage.set(1);
    this.loadServerPage();
  }

  /** Fake API: filters, sorts and slices a local dataset after a short delay. */
  private loadServerPage(): void {
    this.serverLoading.set(true);
    clearTimeout(this.serverTimer);
    this.serverTimer = setTimeout(() => {
      const term = this.serverSearch().trim().toLowerCase();
      const filters = this.serverFilters();
      let rows = ALL_USERS.filter((user) => {
        const matchesSearch =
          !term ||
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.role.toLowerCase().includes(term);
        const matchesFilters = (Object.keys(filters) as (keyof ServerUser)[]).every(
          (key) => !filters[key] || String(user[key]) === filters[key],
        );
        return matchesSearch && matchesFilters;
      });

      const activeSort = this.serverSort();
      if (activeSort) {
        const { key, direction } = activeSort;
        const factor = direction === 'asc' ? 1 : -1;
        rows = [...rows].sort((a, b) => {
          const left = String(a[key as keyof ServerUser] ?? '');
          const right = String(b[key as keyof ServerUser] ?? '');
          return left.localeCompare(right, undefined, { numeric: true }) * factor;
        });
      }

      const size = Math.max(1, this.serverPageSize());
      const pageCount = Math.max(1, Math.ceil(rows.length / size));
      const page = Math.min(Math.max(1, this.serverPage()), pageCount);
      this.serverPage.set(page);
      this.serverTotal.set(rows.length);
      this.serverRows.set(rows.slice((page - 1) * size, page * size));
      this.serverLoading.set(false);
    }, 400);
  }

  /* ------------------------------------------------------------------ */
  /* Dropdown handlers                                                   */
  /* ------------------------------------------------------------------ */

  onSelectionChange(event: unknown): void {
    console.log('Selection changed:', event);
  }

  onMultiSelectionChange(event: unknown): void {
    console.log('Multi selection changed:', event);
  }
}
