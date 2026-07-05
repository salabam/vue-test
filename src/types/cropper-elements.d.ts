// Minimal ambient typings for the subset of the Cropper.js v2 custom-element
// API this app calls programmatically. Cropper.js v2 registers these as real
// DOM custom elements (side-effect of `import 'cropperjs'` in main.ts), so
// TypeScript needs to know their shape when we grab them via refs/queries.
// The Vue template side is handled separately via `isCustomElement` in
// vite.config.ts, which tells the compiler to treat `cropper-*` tags as
// plain native elements (loosely typed attrs) rather than Vue components.

export interface CropperCanvasElement extends HTMLElement {
  $toCanvas(options?: {
    width?: number
    height?: number
    beforeDraw?: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
  }): Promise<HTMLCanvasElement>
}

export interface CropperImageElement extends HTMLElement {
  src: string
  $image: {
    naturalWidth: number
    naturalHeight: number
  }
  $ready(callback: (image: HTMLImageElement) => void): Promise<HTMLImageElement>
  $zoom(scale: number, x?: number, y?: number): CropperImageElement
  $center(): CropperImageElement
  $resetTransform(): CropperImageElement
}

export interface CropperSelectionElement extends HTMLElement {
  x: number
  y: number
  width: number
  height: number
  aspectRatio: number
  $toCanvas(options?: {
    width?: number
    height?: number
    beforeDraw?: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
  }): Promise<HTMLCanvasElement>
  $reset(): CropperSelectionElement
  $center(): CropperSelectionElement
}
