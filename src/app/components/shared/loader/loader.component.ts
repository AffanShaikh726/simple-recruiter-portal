import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="{'flex justify-center items-center': centered}" 
         [class]="containerClass">
      <div class="loading loading-spinner" [class]="sizeClass"></div>
      <span *ngIf="text" class="ml-2 text-sm">{{ text }}</span>
    </div>
  `
})
export class LoaderComponent {
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  @Input() text: string = '';
  @Input() centered: boolean = true;
  @Input() containerClass: string = '';

  get sizeClass(): string {
    return `loading-${this.size}`;
  }
}
