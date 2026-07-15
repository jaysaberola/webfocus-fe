declare module "js-beautify" {
  export function html(source: string, options?: Record<string, any>): string;
  export function css(source: string, options?: Record<string, any>): string;
  export function js(source: string, options?: Record<string, any>): string;
}
