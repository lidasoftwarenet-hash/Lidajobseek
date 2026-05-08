import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from './services/auth.service';
import { SettingsService } from './services/settings.service';
import { ToastService } from './services/toast.service';
import { KeyboardShortcutsService } from './services/keyboard-shortcuts.service';

import { of } from 'rxjs';
import { LucideAngularModule, Sparkles } from 'lucide-angular';

describe('AppComponent', () => {
  let fixture: any;
  let component: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        LucideAngularModule.pick({ Sparkles })
      ],
      providers: [
        { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', ['isAuthenticated', 'logout']) },
        { provide: SettingsService, useValue: jasmine.createSpyObj('SettingsService', ['hydrateFromStoredUser', 'getSettings'], { openSettings$: of() }) },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['show']) },
        { provide: KeyboardShortcutsService, useValue: jasmine.createSpyObj('KeyboardShortcutsService', ['getShortcuts']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have the 'ui' title`, () => {
    expect(component.title).toEqual('Reqcue');
  });
});
