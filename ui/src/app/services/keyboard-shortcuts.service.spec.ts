import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { KeyboardShortcutsService } from './keyboard-shortcuts.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastService } from './toast.service';

xdescribe('KeyboardShortcutsService', () => {
  let service: KeyboardShortcutsService;
  let router: Router;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    const toastSpy = jasmine.createSpyObj('ToastService', ['show']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        KeyboardShortcutsService,
        { provide: ToastService, useValue: toastSpy }
      ]
    });
    service = TestBed.inject(KeyboardShortcutsService);
    router = TestBed.inject(Router);
    toastServiceSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  afterEach(() => {
    service.ngOnDestroy();
    // Hard cleanup of any leftover listeners on document
    const oldListener = (service as any).keydownListener;
    if (oldListener) {
      document.removeEventListener('keydown', oldListener);
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register default shortcuts', () => {
    const shortcuts = service.getShortcuts();
    expect(shortcuts.length).toBeGreaterThan(0);
    expect(shortcuts.find(s => s.description === 'Go to Dashboard')).toBeDefined();
  });

  it('should register a new shortcut', () => {
    const spy = jasmine.createSpy('action');
    service.registerShortcut({
      key: 'k',
      alt: true,
      description: 'Test shortcut',
      action: spy
    });

    const shortcuts = service.getShortcuts();
    expect(shortcuts.find(s => s.description === 'Test shortcut')).toBeDefined();
  });

  it('should format shortcut display correctly', () => {
    const display = service.getShortcutDisplay({
      key: 'n',
      description: 'Test'
    } as any);
    expect(display).toBe('N');
  });

  xit('should trigger action on keyboard event', fakeAsync(() => {
    const spy = jasmine.createSpy('action');
    service.registerShortcut({
      key: 'j',
      ctrl: true,
      description: 'Trigger test',
      action: spy
    });

    const event = new KeyboardEvent('keydown', {
      key: 'j',
      ctrlKey: true
    });
    document.dispatchEvent(event);
    flush();

    expect(spy).toHaveBeenCalled();
  }));

  xit('should not trigger action when typing in input', fakeAsync(() => {
    const spy = jasmine.createSpy('action');
    service.registerShortcut({
      key: 'j',
      ctrl: true,
      description: 'Input test',
      action: spy
    });

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'j',
      ctrlKey: true,
      bubbles: true
    });
    input.dispatchEvent(event);
    flush();

    expect(spy).not.toHaveBeenCalled();
    document.body.removeChild(input);
  }));

  xit('should navigate to dashboard when D key is pressed', fakeAsync(() => {
    spyOn(router, 'navigate');
    const event = new KeyboardEvent('keydown', { key: 'd' });
    document.dispatchEvent(event);
    flush();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  }));
});
