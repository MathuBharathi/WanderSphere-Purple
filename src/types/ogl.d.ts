declare module 'ogl' {
  export class Renderer {
    gl: any;
    constructor(options?: any);
    setSize(width: number, height: number): void;
    render(options: { scene: any; camera: any }): void;
  }
  export class Camera {
    fov: number;
    aspect: number;
    position: { x: number; y: number; z: number };
    constructor(gl: any, options?: any);
    perspective(options: { aspect: number }): void;
  }
  export class Transform {
    constructor();
  }
  export class Plane {
    constructor(gl: any, options?: any);
  }
  export class Mesh {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number; set(x: number, y: number, z: number): void };
    program: any;
    constructor(gl: any, options?: any);
    setParent(parent: any): void;
  }
  export class Program {
    uniforms: Record<string, { value: any }>;
    constructor(gl: any, options?: any);
  }
  export class Texture {
    image: any;
    constructor(gl: any, options?: any);
  }
}
