import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProcessesService } from './processes.service';
import { environment } from '../../environments/environment';

describe('ProcessesService', () => {
  let service: ProcessesService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/processes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProcessesService]
    });
    service = TestBed.inject(ProcessesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('normalizePayload() via create/update', () => {
    it('should convert YYYY-MM-DD dates to ISO strings', () => {
      const input = {
        companyName: 'Test',
        initialInviteDate: '2026-05-06',
        nextFollowUp: '2026-05-10'
      };

      service.create(input).subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.initialInviteDate).toContain('2026-05-06T');
      expect(req.request.body.nextFollowUp).toContain('2026-05-10T');
    });

    it('should convert salaryExpectation to number', () => {
      const input = {
        companyName: 'Test',
        salaryExpectation: '50000'
      };

      service.update(1, input).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.salaryExpectation).toBe(50000);
    });

    it('should set empty dates to null', () => {
      const input = {
        companyName: 'Test',
        initialInviteDate: ''
      };

      service.create(input).subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.body.initialInviteDate).toBeNull();
    });
    it('should NOT nullify missing dates in partial updates (PATCH)', () => {
      const input = {
        currentStage: 'Interview'
      };

      service.update(1, input).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.body.currentStage).toBe('Interview');
      expect(req.request.body.initialInviteDate).toBeUndefined();
      expect(req.request.body.nextFollowUp).toBeUndefined();
    });
  });
});
