declare module 'JSONStream' {
  import { Transform } from 'stream';

  export function parse(path?: string): Transform;
  export function stringify(): Transform;
  export function stringifyObject(): Transform;
}
