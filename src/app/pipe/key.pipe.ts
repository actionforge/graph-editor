import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'key'
})
export class KeyPipe implements PipeTransform {
    transform(value: Set<string>): string[] {
        return Array.from(value);
    }
}