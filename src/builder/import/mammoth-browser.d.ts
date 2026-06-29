// The mammoth package ships types for its main entry but not the browser subpath we use
// in the client bundle. Minimal declaration for the one function we call.
declare module "mammoth/mammoth.browser" {
  export function extractRawText(input: {
    arrayBuffer: ArrayBuffer;
  }): Promise<{ value: string; messages: unknown[] }>;
}
