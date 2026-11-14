/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module 'three' {
  const THREE: any;
  export = THREE;
}

declare module 'three/examples/jsm/controls/OrbitControls.js' {
  export class OrbitControls {
    constructor(object: any, domElement?: HTMLElement | null);
    enableDamping: boolean;
    dampingFactor: number;
    maxPolarAngle: number;
    minDistance: number;
    maxDistance: number;
    target: any;
    update(): boolean;
    dispose(): void;
  }
}