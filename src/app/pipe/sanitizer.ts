import { Pipe, PipeTransform, inject } from "@angular/core";
import { DomSanitizer } from '@angular/platform-browser';
import * as DOMPurify from "dompurify";

@Pipe({
    name: 'sanitize'
})
export class SanitizeHtmlPipe implements PipeTransform {

    sanitizer = inject(DomSanitizer);

    public transform(value: string): string {
        return DOMPurify.sanitize(value);
    }
}
