declare module 'node-xml-stream' {
  import { EventEmitter } from 'events';

  export default class StreamParser extends EventEmitter {
    constructor();
    write(data: string): void;

    on(event: 'opentag', listener: (name: string, attrs: Record<string, string>) => void): this;
    on(event: 'closetag', listener: (name: string) => void): this;
    on(event: 'text', listener: (text: string) => void): this;
    on(event: 'cdata', listener: (cdata: string) => void): this;
    on(event: 'instruction', listener: (name: string, attrs: Record<string, string>) => void): this;
    on(event: string, listener: Function): this;
  }
}
