import { TestBed } from '@angular/core/testing';

import { ProgressMarker } from './progress-marker';

describe('ProgressMarker', () => {
  let service: ProgressMarker;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgressMarker);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
