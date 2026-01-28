import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkerDetail } from './marker-detail';

describe('MarkerDetail', () => {
  let component: MarkerDetail;
  let fixture: ComponentFixture<MarkerDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkerDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkerDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
