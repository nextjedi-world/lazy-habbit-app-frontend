import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkerForm } from './marker-form';

describe('MarkerForm', () => {
  let component: MarkerForm;
  let fixture: ComponentFixture<MarkerForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkerForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkerForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
