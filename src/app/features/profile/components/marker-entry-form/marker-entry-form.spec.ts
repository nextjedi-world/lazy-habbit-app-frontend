import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkerEntryForm } from './marker-entry-form';

describe('MarkerEntryForm', () => {
  let component: MarkerEntryForm;
  let fixture: ComponentFixture<MarkerEntryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkerEntryForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkerEntryForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
