declare module '*.json' {
  const value: any;
  export default value;
}

declare module 'node:module' {
  export function register(specifier: string, parentURL: string | URL): void;
} 