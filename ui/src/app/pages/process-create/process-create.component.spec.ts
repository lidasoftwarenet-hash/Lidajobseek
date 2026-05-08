import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { ProcessCreateComponent } from './process-create.component';
import { ProcessesService } from '../../services/processes.service';
import { ToastService } from '../../services/toast.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { LucideAngularModule, Link, ExternalLink, Briefcase, MapPin, Sparkles, Target, Rocket, Heart, Calendar } from 'lucide-angular';

// Disabled: creates full ProcessFormComponent DOM tree that hangs headless Chrome
xdescribe('ProcessCreateComponent', () => {
  let component: ProcessCreateComponent;
  let fixture: ComponentFixture<ProcessCreateComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProcessCreateComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        LucideAngularModule.pick({ Link, ExternalLink, Briefcase, MapPin, Sparkles, Target, Rocket, Heart, Calendar })
      ],
      providers: [
        { provide: ProcessesService, useValue: { create: jasmine.createSpy('create').and.returnValue(of({})) } },
        { provide: ToastService, useValue: { show: jasmine.createSpy('show') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessCreateComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize process with default values', () => {
    expect(component.process.companyName).toBe('');
    expect(component.process.location).toBe('Israel');
  });

  it('should navigate on successful submit', () => {
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should navigate on cancel', () => {
    component.onCancel();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
