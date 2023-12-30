import { Directive, ElementRef, Renderer2, forwardRef, HostListener, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';


@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: 'vscode-text-area[ngModel]',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => VscodeTextAreaValueAccessorDirective),
            multi: true
        }
    ]
})
export class VscodeTextAreaValueAccessorDirective implements ControlValueAccessor {
    private readonly elementRef = inject(ElementRef);
    private readonly renderer = inject(Renderer2);

    private onChange: (value: unknown) => void = () => { };
    private onTouched: () => void = () => { };

    writeValue(value: unknown): void {
        this.renderer.setProperty(this.elementRef.nativeElement, 'value', value || '');
    }

    registerOnChange(fn: (value: unknown) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    @HostListener('input', ['$event.target.value'])
    onInput(value: unknown): void {
        if (this.onChange) {
            this.onChange(value);
        }
    }

    @HostListener('blur')
    onBlur(): void {
        if (this.onTouched) {
            this.onTouched();
        }
    }
}
