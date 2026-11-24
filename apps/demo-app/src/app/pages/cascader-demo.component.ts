import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CascaderChangeEvent,
  CascaderComponent,
  CascaderOption,
  CascaderSearchResult,
} from '@ithouse-bd/ngx-dropdown';

/** Flatten a cascader tree into `parentValue -> children`, like an address API index. */
function buildAreaIndex(tree: CascaderOption[]): Record<string, CascaderOption[]> {
  const index: Record<string, CascaderOption[]> = {};
  const walk = (nodes: CascaderOption[]): void => {
    for (const node of nodes) {
      const children = node.children ?? [];
      if (!children.length) continue;
      index[node.value] = children.map((child) => ({
        value: child.value,
        label: child.label,
        disabled: child.disabled,
        isLeaf: !(child.children?.length ?? 0),
      }));
      walk(children);
    }
  };
  walk(tree);
  return index;
}

/** Server-side search over the demo tree, returning each hit with its full path. */
function findAreaHits(tree: CascaderOption[], term: string): CascaderSearchResult[] {
  const query = term.trim().toLowerCase();
  const hits: CascaderSearchResult[] = [];

  const walk = (nodes: CascaderOption[], trail: CascaderOption[]): void => {
    for (const node of nodes) {
      const path = [
        ...trail,
        { value: node.value, label: node.label, disabled: node.disabled } as CascaderOption,
      ];
      if (node.label.toLowerCase().includes(query)) {
        hits.push({ option: path[path.length - 1], path });
      }
      if (node.children?.length) walk(node.children, path);
    }
  };

  walk(tree, []);
  return hits.slice(0, 8);
}

/** Root → leaf trail for a value, like an address endpoint used when editing a record. */
function findAreaPath(tree: CascaderOption[], value: any): CascaderOption[] {
  for (const node of tree) {
    if (node.value === value) return [{ value: node.value, label: node.label }];
    const found = node.children ? findAreaPath(node.children, value) : [];
    if (found.length) return [{ value: node.value, label: node.label }, ...found];
  }
  return [];
}

@Component({
  selector: 'app-cascader-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CascaderComponent],
  templateUrl: './cascader-demo.component.html',
})
export class CascaderDemoComponent {
  readonly areas: CascaderOption[] = [
    {
      value: 'barishal',
      label: 'Barishal',
      children: [
        {
          value: 'barguna',
          label: 'Barguna',
          children: [
            { value: 'amtali', label: 'Amtali' },
            { value: 'bamna', label: 'Bamna' },
            { value: 'barguna-sadar', label: 'Barguna Sadar' },
            { value: 'betagi', label: 'Betagi' },
            { value: 'patharghata', label: 'Patharghata' },
            { value: 'taltali', label: 'Taltali', disabled: true },
          ],
        },
        {
          value: 'barishal-sadar',
          label: 'Barishal Sadar',
          children: [
            { value: 'babuganj', label: 'Babuganj' },
            { value: 'banaripara', label: 'Banaripara' },
            { value: 'gaurnadi', label: 'Gaurnadi' },
            { value: 'muladi', label: 'Muladi' },
          ],
        },
        {
          value: 'bhola',
          label: 'Bhola (not serviceable)',
          disabled: true,
          children: [
            { value: 'bhola-sadar', label: 'Bhola Sadar' },
            { value: 'borhanuddin', label: 'Borhanuddin' },
            { value: 'char-fasson', label: 'Char Fasson' },
          ],
        },
      ],
    },
    {
      value: 'chattogram',
      label: 'Chattogram',
      children: [
        {
          value: 'chattogram-sadar',
          label: 'Chattogram',
          children: [
            { value: 'chandgaon', label: 'Chandgaon' },
            { value: 'double-mooring', label: 'Double Mooring' },
            { value: 'kotwali', label: 'Kotwali' },
            { value: 'pahartali', label: 'Pahartali' },
          ],
        },
        {
          value: 'coxs-bazar',
          label: "Cox's Bazar",
          children: [
            { value: 'chakaria', label: 'Chakaria' },
            { value: 'coxs-bazar-sadar', label: "Cox's Bazar Sadar" },
            { value: 'teknaf', label: 'Teknaf' },
            { value: 'ukhiya', label: 'Ukhiya' },
          ],
        },
      ],
    },
    {
      value: 'dhaka',
      label: 'Dhaka',
      children: [
        {
          value: 'dhaka-sadar',
          label: 'Dhaka',
          children: [
            { value: 'dhanmondi', label: 'Dhanmondi' },
            { value: 'gulshan', label: 'Gulshan' },
            { value: 'mirpur', label: 'Mirpur' },
            { value: 'uttara', label: 'Uttara' },
          ],
        },
        {
          value: 'gazipur',
          label: 'Gazipur',
          children: [
            { value: 'gazipur-sadar', label: 'Gazipur Sadar' },
            { value: 'kaliakair', label: 'Kaliakair' },
            { value: 'kapasia', label: 'Kapasia' },
          ],
        },
      ],
    },
    {
      value: 'khulna',
      label: 'Khulna',
      children: [
        {
          value: 'khulna-sadar',
          label: 'Khulna',
          children: [
            { value: 'daulatpur', label: 'Daulatpur' },
            { value: 'khalishpur', label: 'Khalishpur' },
            { value: 'sonadanga', label: 'Sonadanga' },
          ],
        },
        {
          value: 'jashore',
          label: 'Jashore',
          children: [
            { value: 'abhaynagar', label: 'Abhaynagar' },
            { value: 'jashore-sadar', label: 'Jashore Sadar' },
            { value: 'jhikargacha', label: 'Jhikargacha' },
          ],
        },
      ],
    },
    {
      value: 'mymensingh',
      label: 'Mymensingh',
      children: [
        {
          value: 'mymensingh-sadar',
          label: 'Mymensingh',
          children: [
            { value: 'bhaluka', label: 'Bhaluka' },
            { value: 'muktagacha', label: 'Muktagacha' },
            { value: 'trishal', label: 'Trishal' },
          ],
        },
      ],
    },
    {
      value: 'rajshahi',
      label: 'Rajshahi',
      children: [
        {
          value: 'rajshahi-sadar',
          label: 'Rajshahi',
          children: [
            { value: 'boalia', label: 'Boalia' },
            { value: 'motihar', label: 'Motihar' },
            { value: 'paba', label: 'Paba' },
          ],
        },
        {
          value: 'bogura',
          label: 'Bogura',
          children: [
            { value: 'bogura-sadar', label: 'Bogura Sadar' },
            { value: 'sherpur', label: 'Sherpur' },
            { value: 'sibganj', label: 'Sibganj' },
          ],
        },
      ],
    },
    {
      value: 'rangpur',
      label: 'Rangpur',
      children: [
        {
          value: 'rangpur-sadar',
          label: 'Rangpur',
          children: [
            { value: 'badarganj', label: 'Badarganj' },
            { value: 'gangachara', label: 'Gangachara' },
            { value: 'pirgacha', label: 'Pirgacha' },
          ],
        },
      ],
    },
    {
      value: 'sylhet',
      label: 'Sylhet',
      children: [
        {
          value: 'sylhet-sadar',
          label: 'Sylhet',
          children: [
            { value: 'beanibazar', label: 'Beanibazar' },
            { value: 'golapganj', label: 'Golapganj' },
            { value: 'sylhet-sadar-upazila', label: 'Sylhet Sadar' },
          ],
        },
      ],
    },
  ];

  readonly categories: CascaderOption[] = [
    {
      value: 'electronics',
      label: 'Electronics',
      children: [
        {
          value: 'mobile',
          label: 'Mobile Phone',
          children: [
            { value: 'smartphone', label: 'Smartphone' },
            { value: 'feature-phone', label: 'Feature Phone' },
            { value: 'mobile-accessories', label: 'Accessories' },
          ],
        },
        {
          value: 'computer',
          label: 'Computer',
          children: [
            { value: 'laptop', label: 'Laptop' },
            { value: 'desktop', label: 'Desktop' },
            { value: 'monitor', label: 'Monitor' },
          ],
        },
      ],
    },
    {
      value: 'fashion',
      label: 'Fashion',
      children: [
        {
          value: 'men',
          label: 'Men',
          children: [
            { value: 'shirt', label: 'Shirt' },
            { value: 'pant', label: 'Pant' },
          ],
        },
        {
          value: 'women',
          label: 'Women',
          children: [
            { value: 'saree', label: 'Saree' },
            { value: 'kurti', label: 'Kurti' },
          ],
        },
      ],
    },
  ];

  /** Root level only — each level below it is fetched by `loadAreaChildren`. */
  readonly areaRoots: CascaderOption[] = this.areas.map(({ value, label }) => ({ value, label }));
  readonly areaPlaceholders = ['Select Division', 'Select District', 'Select Sub-district'];
  private readonly areaChildrenIndex = buildAreaIndex(this.areas);

  /** Simulated API: one call per level, ~600 ms, like a real address endpoint. */
  readonly loadAreaChildren = (node: CascaderOption): Promise<CascaderOption[]> =>
    new Promise((resolve) =>
      setTimeout(() => resolve(this.areaChildrenIndex[node.value] ?? []), 600),
    );

  /** Simulated API: label path for an existing value (edit mode), ~500 ms. */
  readonly resolveAreaValue = (value: string): Promise<CascaderOption[]> =>
    new Promise((resolve) => setTimeout(() => resolve(findAreaPath(this.areas, value)), 500));

  /** Simulated API: server-side search across the whole tree, ~400 ms. */
  readonly searchAreas = (term: string): Promise<CascaderSearchResult[]> =>
    new Promise((resolve) => setTimeout(() => resolve(findAreaHits(this.areas, term)), 400));

  deliveryArea: string | null = null;
  category: string | null = null;
  areaPath = '';
  categoryPath = '';

  onAreaChange(event: CascaderChangeEvent): void {
    this.areaPath = event.path.map((node) => node.label).join(' → ');
  }

  /** Simulates opening a saved record in an edit form. */
  loadSavedArea(): void {
    this.deliveryArea = 'uttara';
    this.areaPath = '';
  }

  onCategoryChange(event: CascaderChangeEvent): void {
    this.categoryPath = event.path.map((node) => node.label).join(' → ');
  }
}
