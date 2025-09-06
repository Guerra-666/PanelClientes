/// <reference types="astro/client" />

declare namespace JSX {
  interface IntrinsicElements {
    // Permite cualquier elemento HTML/JSX sin error de tipado
    [elemName: string]: any;
  }
}
