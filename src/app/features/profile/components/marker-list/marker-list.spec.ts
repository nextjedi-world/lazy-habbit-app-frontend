import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkerList } from './marker-list';

describe('MarkerList', () => {
  let component: MarkerList;
  let fixture: ComponentFixture<MarkerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkerList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkerList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
