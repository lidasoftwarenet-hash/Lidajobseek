import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ProcessEditComponent } from './process-edit.component';
import { ProcessesService } from '../../services/processes.service';
import { ToastService } from '../../services/toast.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { LucideAngularModule, Link, ExternalLink, Briefcase, MapPin, Sparkles, Target, Rocket, Heart, Calendar } from 'lucide-angular';

xdescribe('ProcessEditComponent', () => {
  let component: ProcessEditComponent;
  let fixture: ComponentFixture<ProcessEditComponent>;
  let router: Router;

  const mockProcess = {
    id: 123,
    companyName: 'google',
    roleTitle: 'Full Stack Developer',
    jobDescriptionUrl: 'https://example.com/job'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProcessEditComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        LucideAngularModule.pick({ Link, ExternalLink, Briefcase, MapPin, Sparkles, Target, Rocket, Heart, Calendar })
      ],
      providers: [
        {
          provide: ProcessesService,
          useValue: {
            getById: jasmine.createSpy('getById').and.returnValue(of({ ...mockProcess })),
            update: jasmine.createSpy('update').and.returnValue(of({})),
          }
        },
        { provide: ToastService, useValue: { show: jasmine.createSpy('show') } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '123' } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessEditComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load process data on init', () => {
    expect(component.process.id).toBe(123);
    expect(component.process.companyName).toBe('google');
  });

  it('should navigate on successful submit', () => {
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/process', 123]);
  });

  it('should navigate on cancel', () => {
    component.onCancel();
    expect(router.navigate).toHaveBeenCalledWith(['/process', 123]);
  });
});
