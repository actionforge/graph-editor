import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnChanges, SimpleChanges, ViewChild, inject } from '@angular/core';
import { BaseControl, BaseControlType } from 'src/app/helper/rete/basecontrol';
import { GraphService, Permission } from 'src/app/services/graph.service';

@Component({
  selector: 'app-basecontrol',
  templateUrl: './basecontrol.component.html',
  styleUrls: ['./basecontrol.component.scss'],
})
export class BaseControlComponent implements OnChanges {
  cdr = inject(ChangeDetectorRef);
  gs = inject(GraphService);

  BaseControlType = BaseControlType;

  @Input() data!: BaseControl<BaseControlType>;
  @Input() rendered!: () => void;
  @ViewChild('input') inputField: ElementRef<HTMLElement> | undefined;

  Permission = Permission

  constructor() {
    this.cdr.detach();
  }

  getPermission(): Permission {
    return this.gs.getPermission();
  }

  isEmpty(): boolean {
    // To check if this value counts as empty, see what the
    // GitHub Actions toolkit considers as empty. It's
    // `undefined`, `null` and `!val`, meaning empty strings.
    // https://github.com/actions/toolkit/blob/fe3e7ce9a7f995d29d1fcfd226a32bca407f9dc8/packages/core/src/core.ts#L129
    return Boolean(this.data.required && !this.data.getValue());
  }

  ngOnChanges(changes: SimpleChanges): void {
    const seed = changes['seed']
    const data = changes['data']

    if ((seed && seed.currentValue !== seed.previousValue)
      || (data && data.currentValue !== data.previousValue)) {
      this.cdr.detectChanges()
    }
    requestAnimationFrame(() => this.rendered())
  }

  @HostListener("wheel", ["$event"])
  @HostListener('dblclick', ["$event"])
  @HostListener('pointerdown', ["$event"])
  mouseEnter(event: MouseEvent): void {

    // Stop all events from bubbling up as the
    // input field took all the events
    event.stopPropagation();

    // Hack: One exceptions is the 'pointerdown' event.
    // Dragging nodes around is caused by 'pointerdown'.
    // Just stopping the propagation somehow also affects
    // simply clicking into a text field when a text is selected.
    // The code below mimics the click event by finding the original
    // click position in the text field and setting the text cursor
    // at the requested position.
    if (event instanceof PointerEvent) {

      // Calculate the cursor position based on the click coordinates
      const cursorPosition = getCursorPosition(event.clientX, event.clientY, event.target as HTMLInputElement);

      // Set the cursor position in the input field
      if (this.inputField && this.inputField.nativeElement instanceof HTMLInputElement) {
        const inputField: HTMLInputElement = this.inputField.nativeElement;
        if (inputField.type === 'number') {
          // number fields don't have setSelectionRange
          inputField.focus();
        } else {
          inputField.setSelectionRange(cursorPosition, cursorPosition);
        }
      }
    }
  }

  onChange(e: Event | KeyboardEvent | FocusEvent, index?: number, commit?: boolean): void {
    const target = e.target as HTMLInputElement;
    const oldValue = this.data.getValue();

    switch (this.data.type) {
      case BaseControlType.array_string:
      case BaseControlType.array_number:
      case BaseControlType.array_bool: {
        let v = target.value;
        if (v === "" && this.data.required && this.data.default) {
          v = this.data.default as string;
        }

        if (index === undefined || index < 0) {
          throw new Error("Expected index");
        } else if (!Array.isArray(oldValue)) {
          throw new Error("Expected array");
        } else if (index >= oldValue.length) {
          throw new Error("Index out of bounds");
        } else if ((oldValue[index] !== undefined && typeof oldValue[index] !== typeof v)) {
          throw new Error("Expected value of type " + this.data.type);
        }

        oldValue[index] = v as string | number | boolean;
        this.data.setValue(oldValue);
        break;
      }
      case BaseControlType.option:
      case BaseControlType.string: {
        let value = target.value;
        if (value === "" && this.data.required) {
          value = `${this.data.default}`;
        }

        target.value = value as string;
        this.data.setValue(value);
        break;
      }
      case BaseControlType.number: {
        if (e instanceof KeyboardEvent && e.key === 'Enter') {
          commit = true;
        }

        let value = target.value;
        if (value === "") {
          value = this.data.default ? `${this.data.default}` : '';
          if (commit && value === "") {
            value = "0";
          }
        }
        target.value = value as string;
        this.data.setValue(+value);
        break;
      }
      case BaseControlType.bool: {
        this.data.setValue(target.checked);
        break;
      }
    }

    if (e instanceof KeyboardEvent && e.key === 'Enter' || e.type === 'blur') {
      this.cdr.detectChanges();
    }
  }
}

function getCursorPosition(x: number, y: number, inputElement: HTMLInputElement): number {

  // For <vscode-text-area> elements, find the original textarea element inside
  if (inputElement.tagName === 'VSCODE-TEXT-AREA') {
    const elem = inputElement.shadowRoot!.querySelector('textarea');
    inputElement = elem as unknown as HTMLInputElement;
  }

  if (inputElement instanceof HTMLTextAreaElement) {

    const rect = inputElement.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(inputElement).lineHeight) || 1;

    // Calculate the line number based on the click coordinates
    const lineNumber = Math.floor((y - rect.top) / lineHeight);

    // Calculate the character index based on the click coordinates
    const charIndex = Math.round((x - rect.left) / inputElement.clientWidth * inputElement.value.length);

    // Get the position in the text content by considering line breaks
    const lines = inputElement.value.split('\n');
    let position = 0;

    for (let i = 0; i < lineNumber && i < lines.length; i++) {
      position += lines[i].length + 1; // +1 for the line break
    }

    return position + charIndex;
  } else {
    const rect = inputElement.getBoundingClientRect();
    const position = x - rect.left;

    // Convert the position to the corresponding character index
    const index = Math.round(position / (inputElement.clientWidth / inputElement.value.length));

    return index;
  }
}