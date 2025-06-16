/**
 * XML Declaration class for XML version and encoding information
 */
export class XmlDeclaration {
  public readonly name = 'declaration';
  public readonly version: string;
  public readonly encoding: string;

  constructor(version: string, encoding: string) {
    this.version = version;
    this.encoding = encoding;
  }
}

/**
 * XML Tag class representing an XML element
 */
export class XmlTag {
  public name: string;
  public value: string | null;
  public attributes: Record<string, string>;
  public tags: XmlTag[];
  public inheritFrom?: {
    index: number | null;
    name: string | null;
    tagIndex?: number;
  };

  constructor(
    name: string,
    value: string | null = null,
    attributes: Record<string, string> = {},
    tags: XmlTag[] = [],
  ) {
    this.name = name;
    this.value = value;
    this.attributes = attributes;
    this.tags = tags;
  }

  /**
   * Create a new instance with the same properties
   */
  reset(): XmlTag {
    return new XmlTag(this.name, this.value, this.attributes, this.tags);
  }
}

/**
 * XML Character Data (CDATA) class
 */
export class XmlCharacterData {
  public readonly name = 'cdata';
  public readonly cdata: string;

  constructor(cdata: string) {
    this.cdata = cdata;
  }
}
