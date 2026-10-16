# Angular Component Generation Skill

## Description
Generates modern Angular 17+ standalone components following best practices, including signals, OnPush change detection, accessibility, and proper TypeScript typing. This skill ensures all generated components meet WCAG 2.2 AA standards and follow the project's coding conventions.

## When to Use This Skill

Use this skill when you need to create:
- New standalone Angular components
- Smart (container) components with business logic
- Dumb (presentational) components with inputs/outputs
- Form components with validation
- List components with virtual scrolling
- Modal/dialog components
- Accessible interactive components

## Prerequisites

Before using this skill:
1. Read `frontend/context/angular-best-practices.md`
2. Read `frontend/CLAUDE.md` for project-specific patterns
3. Understand the feature requirements and accessibility needs

## Instructions

### Step 1: Generate Component with Angular CLI

**ALWAYS use Angular CLI** to create the component structure:

```bash
# For feature components
ng generate component features/[feature]/components/[name] --standalone

# For shared components
ng generate component shared/components/[name] --standalone

# Examples:
ng generate component features/dashboard/components/task-list --standalone
ng generate component shared/components/progress-dots --standalone
```

### Step 2: Apply Standard Component Structure

After CLI generation, update the component with this structure:

```typescript
import { Component, ChangeDetectionStrategy, signal, computed, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-[name]',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './[name].component.html',
  styleUrl: './[name].component.scss'
})
export class [Name]Component {
  // 1. Dependency Injection (inject function)
  private readonly service = inject(RequiredService);

  // 2. Inputs (signal-based)
  requiredData = input.required<DataType>();
  optionalConfig = input<ConfigType>({ /* defaults */ });

  // 3. Outputs
  itemSelected = output<ItemType>();
  actionTriggered = output<void>();

  // 4. Local State (signals)
  isLoading = signal(false);
  selectedId = signal<string | null>(null);
  items = signal<ItemType[]>([]);

  // 5. Computed Values
  filteredItems = computed(() => {
    // Derived state logic
  });
  hasItems = computed(() => this.items().length > 0);

  // 6. Lifecycle Hooks
  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  // 7. Public Event Handlers
  onItemClick(id: string) {
    this.selectedId.set(id);
    this.itemSelected.emit(this.items().find(i => i.id === id));
  }

  // 8. Private Helper Methods
  private async loadData() {
    this.isLoading.set(true);
    try {
      const data = await this.service.getData();
      this.items.set(data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

### Step 3: Create Accessible Template

Use native control flow and proper ARIA attributes:

```html
<!-- Loading State -->
@if (isLoading()) {
  <div role="status" aria-live="polite">
    <mat-spinner diameter="40" />
    <span class="visually-hidden">Loading...</span>
  </div>
}

<!-- Error State -->
@else if (hasError()) {
  <div role="alert" class="error-message">
    {{ errorMessage() }}
  </div>
}

<!-- Main Content -->
@else {
  <section [attr.aria-labelledby]="headingId">
    <h2 [id]="headingId">{{ title() }}</h2>

    <!-- List with native @for -->
    @for (item of items(); track item.id) {
      <article class="item" [class.selected]="selectedId() === item.id">
        <h3>{{ item.name }}</h3>

        <button
          type="button"
          [attr.aria-label]="getItemAriaLabel(item)"
          [attr.aria-pressed]="selectedId() === item.id"
          (click)="onItemClick(item.id)">
          {{ item.action }}
        </button>
      </article>
    } @empty {
      <p class="empty-state">No items available</p>
    }
  </section>
}

<!-- Form Example -->
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <div class="form-field">
    <label for="item-name">Item Name</label>
    <input
      id="item-name"
      type="text"
      formControlName="name"
      [attr.aria-required]="true"
      [attr.aria-invalid]="nameControl.invalid && nameControl.touched"
      [attr.aria-describedby]="nameControl.invalid ? 'name-error' : null" />

    @if (nameControl.invalid && nameControl.touched) {
      <span id="name-error" role="alert" class="error">
        {{ getNameError() }}
      </span>
    }
  </div>

  <button
    type="submit"
    [disabled]="form.invalid || isSubmitting()">
    @if (isSubmitting()) {
      <span>Saving...</span>
    } @else {
      <span>Save</span>
    }
  </button>
</form>
```

### Step 4: Add Accessibility Features

#### Required ARIA Attributes

```typescript
// Generate descriptive ARIA labels
private getItemAriaLabel(item: ItemType): string {
  const status = this.selectedId() === item.id ? 'selected' : 'not selected';
  return `${item.name}, ${item.description}, ${status}`;
}

// Announce dynamic changes
private announcer = inject(LiveAnnouncer);

async performAction() {
  await this.service.doSomething();
  this.announcer.announce('Action completed successfully', 'polite');
}
```

#### Keyboard Navigation

```typescript
@HostListener('keydown', ['$event'])
onKeyDown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      this.selectNext();
      break;
    case 'ArrowUp':
      event.preventDefault();
      this.selectPrevious();
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      this.activateSelected();
      break;
    case 'Escape':
      event.preventDefault();
      this.clearSelection();
      break;
  }
}
```

#### Focus Management

```typescript
@ViewChild('firstFocusable', { read: ElementRef })
firstFocusable?: ElementRef<HTMLElement>;

ngAfterViewInit() {
  // Auto-focus first interactive element
  this.firstFocusable?.nativeElement.focus();
}
```

### Step 5: Add Styles with Accessibility

```scss
// [name].component.scss

:host {
  display: block;
}

// Ensure sufficient color contrast (WCAG AA: 4.5:1 for text)
.item {
  color: #212121;  // Contrast ratio: 16:1 on white
  background: #ffffff;

  &:hover {
    background: #f5f5f5;
  }

  &:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }

  &.selected {
    background: #e3f2fd;
    border-left: 4px solid #1976d2;
  }
}

// Touch targets must be at least 24x24px
button {
  min-width: 24px;
  min-height: 24px;
  padding: 8px 16px;
}

// Visually hidden but accessible to screen readers
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

// Loading state
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

// Empty state
.empty-state {
  text-align: center;
  color: #757575;
  padding: 32px;
}

// Error state
.error-message {
  color: #d32f2f;
  background: #ffebee;
  padding: 12px 16px;
  border-radius: 4px;
  border-left: 4px solid #d32f2f;
}
```

### Step 6: Create Component Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { [Name]Component } from './[name].component';

describe('[Name]Component', () => {
  let component: [Name]Component;
  let fixture: ComponentFixture<[Name]Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [[Name]Component]
    }).compileComponents();

    fixture = TestBed.createComponent([Name]Component);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Inputs', () => {
    it('should accept required data input', () => {
      const testData = { id: 1, name: 'Test' };
      fixture.componentRef.setInput('requiredData', testData);
      fixture.detectChanges();

      expect(component.requiredData()).toEqual(testData);
    });
  });

  describe('Outputs', () => {
    it('should emit itemSelected when item clicked', () => {
      const spy = jasmine.createSpy('itemSelected');
      component.itemSelected.subscribe(spy);

      const testItem = { id: '1', name: 'Item' };
      component.onItemClick('1');

      expect(spy).toHaveBeenCalledWith(testItem);
    });
  });

  describe('State Management', () => {
    it('should update isLoading signal during data load', async () => {
      expect(component.isLoading()).toBe(false);

      const loadPromise = component['loadData']();
      expect(component.isLoading()).toBe(true);

      await loadPromise;
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      fixture.componentRef.setInput('requiredData', { id: 1, name: 'Test' });
      fixture.detectChanges();

      const violations = await checkA11y(fixture.nativeElement);
      expect(violations).toHaveLength(0);
    });

    it('should have proper ARIA labels on interactive elements', () => {
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');

      buttons.forEach(button => {
        expect(button.hasAttribute('aria-label') || button.textContent.trim()).toBeTruthy();
      });
    });
  });
});
```

## Component Type Templates

### Smart Component (Container)

```typescript
// features/dashboard/dashboard.component.ts
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TaskListComponent, ProgressSummaryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <app-progress-summary [weekData]="weekData()" />

      @for (category of categories(); track category.id) {
        <app-task-list
          [category]="category"
          [tasks]="getTasksForCategory(category.id)"
          (taskComplete)="onTaskComplete($event)" />
      }
    </div>
  `
})
export class DashboardComponent {
  private taskService = inject(TaskService);
  private scoreService = inject(ScoreService);

  // State from services
  tasks = this.taskService.tasks;
  weekData = this.scoreService.currentWeekData;

  // Local computed state
  categories = computed(() => {
    // Group tasks by category
  });

  async ngOnInit() {
    await this.taskService.loadCurrentWeek();
    await this.scoreService.loadCurrentScore();
  }

  async onTaskComplete(taskId: number) {
    await this.taskService.completeTask(taskId);
    await this.scoreService.recalculate();
  }

  getTasksForCategory(categoryId: number) {
    return computed(() =>
      this.tasks().filter(t => t.categoryId === categoryId)
    );
  }
}
```

### Dumb Component (Presentational)

```typescript
// shared/components/task-item/task-item.component.ts
@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="task-item"
      [class.completed]="task().completedCount >= task().targetFrequency"
      [attr.aria-label]="getAriaLabel()"
      (click)="complete.emit(task().id)">

      <span class="task-name">{{ task().name }}</span>
      <span class="task-progress">
        {{ task().completedCount }}/{{ task().targetFrequency }}
      </span>
    </button>
  `,
  styles: [`
    .task-item {
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: white;
      cursor: pointer;
      transition: background 0.2s;

      &:hover { background: #f5f5f5; }
      &:focus-visible {
        outline: 2px solid #1976d2;
        outline-offset: 2px;
      }
      &.completed { opacity: 0.6; }
    }
  `]
})
export class TaskItemComponent {
  task = input.required<PlannedTask>();
  complete = output<number>();

  private getAriaLabel(): string {
    const t = this.task();
    const remaining = t.targetFrequency - t.completedCount;
    return `${t.name}, ${t.completedCount} of ${t.targetFrequency} completed, ${remaining} remaining`;
  }
}
```

## Common Patterns

### Virtual Scrolling (Large Lists)

```typescript
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  imports: [CommonModule, ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="list-viewport">
      @for (item of items(); track item.id) {
        <div class="item">{{ item.name }}</div>
      }
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .list-viewport {
      height: 400px;
      border: 1px solid #ccc;
    }
    .item {
      height: 50px;
      padding: 12px;
    }
  `]
})
```

### Dialog/Modal Component

```typescript
import { DialogModule } from '@angular/cdk/dialog';

@Component({
  imports: [CommonModule, DialogModule],
  template: `
    <div class="dialog-container" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
      <div role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId">
        <h2 [id]="titleId">{{ title() }}</h2>

        <div class="dialog-content">
          <ng-content />
        </div>

        <div class="dialog-actions">
          <button type="button" (click)="cancel.emit()">Cancel</button>
          <button type="button" (click)="confirm.emit()">Confirm</button>
        </div>
      </div>
    </div>
  `
})
export class DialogComponent {
  title = input.required<string>();
  titleId = input<string>('dialog-title');

  cancel = output<void>();
  confirm = output<void>();
}
```

## Verification Checklist

After generating a component, verify:

- [ ] Generated with Angular CLI (`ng generate component`)
- [ ] Component is standalone
- [ ] `ChangeDetectionStrategy.OnPush` is set
- [ ] Uses signals for local state
- [ ] Uses `input()` and `output()` functions
- [ ] Uses native control flow (`@if`, `@for`, `@switch`)
- [ ] All `@for` loops have `track` expressions
- [ ] All interactive elements have accessible names
- [ ] ARIA attributes for dynamic content
- [ ] Keyboard navigation works
- [ ] Color contrast ≥ 4.5:1
- [ ] Touch targets ≥ 24x24px
- [ ] No `any` types (proper TypeScript interfaces)
- [ ] Component has unit tests
- [ ] Tests include accessibility checks
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Loading states implemented

## Related Skills

- `angular-service` - Generate Angular services
- `angular-form` - Generate reactive forms with validation
- `supabase-integration` - Add Supabase queries to components

## Resources

- **Angular Best Practices**: `frontend/context/angular-best-practices.md`
- **Project Conventions**: `frontend/CLAUDE.md`
- **Angular Docs**: https://angular.dev
- **Material Design**: https://material.angular.dev
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/

---

**Remember**: Quality, accessibility, and proper typing are non-negotiable. Every component must be usable by everyone, including keyboard-only users and screen reader users.
