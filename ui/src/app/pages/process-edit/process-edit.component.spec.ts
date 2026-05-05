import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { ProcessEditComponent } from './process-edit.component';
import { ProcessesService } from '../../services/processes.service';
import { ToastService } from '../../services/toast.service';
import { SettingsService } from '../../services/settings.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, BehaviorSubject } from 'rxjs';

describe('ProcessEditComponent', () => {
  let component: ProcessEditComponent;
  let fixture: ComponentFixture<ProcessEditComponent>;

  const mockProcess = {
    id: 1,
    companyName: 'Varonis',
    roleTitle: 'Full Stack Developer',
    techStack: 'Angular, NestJS',
    location: 'Tel Aviv',
    workMode: 'hybrid',
    currentStage: 'Application Submitted',
    companyWebsite: 'varonis.com',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=varonis.com&sz=128',
    interactions: [],
    reviews: [],
    contacts: [],
  };

  const mockSettings = {
    theme: 'dark',
    country: 'Israel',
    avatarStyle: 'bottts',
    profile: { displayName: 'Test User', contactEmail: 'test@test.com' }
  };
  const settingsSubject = new BehaviorSubject(mockSettings);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProcessEditComponent,
        HttpClientTestingModule,
        FormsModule,
        RouterTestingModule,
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
          provide: SettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(mockSettings),
            settings$: settingsSubject.asObservable()
          }
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } }
        },
        ChangeDetectorRef,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load existing companyWebsite and companyLogoUrl from the process', () => {
    expect(component.process.companyWebsite).toBe('varonis.com');
    expect(component.process.companyLogoUrl).toBe(
      'https://www.google.com/s2/favicons?domain=varonis.com&sz=128'
    );
  });

  describe('fetchLogo()', () => {
    it('should clear companyLogoUrl when website is empty', () => {
      component.process.companyWebsite = '';
      component.fetchLogo();
      expect(component.process.companyLogoUrl).toBe('');
    });

    it('should build correct Google Favicon URL for a plain domain', () => {
      component.process.companyWebsite = 'google.com';
      component.fetchLogo();
      expect(component.process.companyLogoUrl).toBe(
        'https://www.google.com/s2/favicons?domain=google.com&sz=128'
      );
    });

    it('should extract domain from https:// URL with path', () => {
      component.process.companyWebsite = 'https://www.microsoft.com/en-us/careers';
      component.fetchLogo();
      expect(component.process.companyLogoUrl).toBe(
        'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128'
      );
    });

    it('should remove www. from plain domain', () => {
      component.process.companyWebsite = 'www.apple.com';
      component.fetchLogo();
      expect(component.process.companyLogoUrl).toBe(
        'https://www.google.com/s2/favicons?domain=apple.com&sz=128'
      );
    });

    it('should NOT update logo if domain is invalid (no dot)', () => {
      component.process.companyLogoUrl = '';
      component.process.companyWebsite = 'localhost';
      component.fetchLogo();
      expect(component.process.companyLogoUrl).toBe('');
    });

    it('should handle URL with query params without including them in domain', () => {
      component.process.companyWebsite = 'boards.greenhouse.io?for=acme';
      component.fetchLogo();
      expect(component.process.companyLogoUrl).toBe(
        'https://www.google.com/s2/favicons?domain=boards.greenhouse.io&sz=128'
      );
    });

    it('should not update logo or call cdr if url is already set to the correct favicon', () => {
      const existingLogo = 'https://www.google.com/s2/favicons?domain=varonis.com&sz=128';
      component.process.companyWebsite = 'varonis.com';
      component.process.companyLogoUrl = existingLogo;
      const cdr = (component as any).cdr;
      spyOn(cdr, 'detectChanges');
      component.fetchLogo();
      expect(cdr.detectChanges).not.toHaveBeenCalled();
    });
  });

  describe('onWebsiteBlur()', () => {
    it('should delegate to fetchLogo', () => {
      spyOn(component, 'fetchLogo');
      component.onWebsiteBlur();
      expect(component.fetchLogo).toHaveBeenCalled();
    });
  });
});
