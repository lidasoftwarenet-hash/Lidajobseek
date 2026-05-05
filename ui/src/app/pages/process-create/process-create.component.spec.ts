import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ChangeDetectorRef } from '@angular/core';
import { ProcessCreateComponent } from './process-create.component';
import { ProcessesService } from '../../services/processes.service';
import { ToastService } from '../../services/toast.service';
import { SettingsService } from '../../services/settings.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';

describe('ProcessCreateComponent', () => {
  let component: ProcessCreateComponent;
  let fixture: ComponentFixture<ProcessCreateComponent>;

  const mockSettings = {
    theme: 'dark',
    language: 'en',
    country: 'United States',
    avatarStyle: 'bottts',
    profile: { displayName: 'Test User', contactEmail: 'test@test.com' }
  };
  const settingsSubject = new BehaviorSubject(mockSettings);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProcessCreateComponent,
        HttpClientTestingModule,
        FormsModule,
        RouterTestingModule,
        CommonModule,
      ],
      providers: [
        { provide: ProcessesService, useValue: { create: jasmine.createSpy('create').and.returnValue(of({})) } },
        { provide: ToastService, useValue: { show: jasmine.createSpy('show') } },
        { provide: SettingsService, useValue: {
          getSettings: jasmine.createSpy('getSettings').and.returnValue(mockSettings),
          settings$: settingsSubject.asObservable()
        }},
        ChangeDetectorRef,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize process with empty companyWebsite and companyLogoUrl', () => {
    expect(component.process.companyWebsite).toBe('');
    expect(component.process.companyLogoUrl).toBe('');
  });

  describe('fetchLogo()', () => {
    it('should set companyLogoUrl to empty string when companyWebsite is empty', () => {
      component.process.companyWebsite = '';
      component.fetchLogo();
      expect(component.process.companyLogoUrl).toBe('');
    });

    it('should extract domain and set Google Favicon URL for a plain domain', () => {
      component.process.companyWebsite = 'varonis.com';
      component.fetchLogo();
      expect(component.process.companyLogoUrl).toBe(
        'https://www.google.com/s2/favicons?domain=varonis.com&sz=128'
      );
    });

    it('should extract domain from a full https URL', () => {
      component.process.companyWebsite = 'https://www.varonis.com/careers';
      component.fetchLogo();
      expect(component.process.companyLogoUrl).toBe(
        'https://www.google.com/s2/favicons?domain=varonis.com&sz=128'
      );
    });

    it('should extract domain from a full http URL without www', () => {
      component.process.companyWebsite = 'http://google.com/about';
      component.fetchLogo();
      expect(component.process.companyLogoUrl).toBe(
        'https://www.google.com/s2/favicons?domain=google.com&sz=128'
      );
    });

    it('should strip www. from plain domain input', () => {
      component.process.companyWebsite = 'www.microsoft.com';
      component.fetchLogo();
      expect(component.process.companyLogoUrl).toBe(
        'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128'
      );
    });

    it('should NOT set a logo URL for an invalid/short input', () => {
      component.process.companyLogoUrl = '';
      component.process.companyWebsite = 'abc'; // No dot, too short
      component.fetchLogo();
      // Logo URL should remain empty because domain is invalid
      expect(component.process.companyLogoUrl).toBe('');
    });

    it('should not update companyLogoUrl if the URL is already the same', () => {
      const existingLogo = 'https://www.google.com/s2/favicons?domain=varonis.com&sz=128';
      component.process.companyWebsite = 'varonis.com';
      component.process.companyLogoUrl = existingLogo;
      // Spy on cdr.detectChanges to verify it was NOT called again (no-op)
      const cdr = (component as any).cdr;
      spyOn(cdr, 'detectChanges');
      component.fetchLogo();
      expect(cdr.detectChanges).not.toHaveBeenCalled();
    });

    it('should handle URL with query parameters correctly', () => {
      component.process.companyWebsite = 'jobs.lever.co?company=acme';
      component.fetchLogo();
      expect(component.process.companyLogoUrl).toBe(
        'https://www.google.com/s2/favicons?domain=jobs.lever.co&sz=128'
      );
    });
  });

  describe('onWebsiteBlur()', () => {
    it('should call fetchLogo when the website field loses focus', () => {
      spyOn(component, 'fetchLogo');
      component.onWebsiteBlur();
      expect(component.fetchLogo).toHaveBeenCalled();
    });
  });

  describe('onSubmit() logo auto-fetch', () => {
    it('should call onWebsiteBlur if website is set but logo is not', () => {
      component.process.companyWebsite = 'varonis.com';
      component.process.companyLogoUrl = '';
      spyOn(component, 'onWebsiteBlur');

      // processForm is not initialized in unit test, so we guard
      (component as any).processForm = { valid: false };
      component.onSubmit();

      expect(component.onWebsiteBlur).toHaveBeenCalled();
    });

    it('should NOT call onWebsiteBlur if logo is already set', () => {
      component.process.companyWebsite = 'varonis.com';
      component.process.companyLogoUrl = 'https://www.google.com/s2/favicons?domain=varonis.com&sz=128';
      spyOn(component, 'onWebsiteBlur');

      (component as any).processForm = { valid: false };
      component.onSubmit();

      expect(component.onWebsiteBlur).not.toHaveBeenCalled();
    });
  });
});
