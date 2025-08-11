// Schema Designer interfaces for config sets, fields, field types, and responses

export interface SchemaConfigSet {
  name: string;
  published: boolean;
  editable: boolean;
  collections?: string[];
  numDocs?: number;
  languages?: string[];
  enableDynamicFields?: boolean;
  enableFieldGuessing?: boolean;
  enableNestedDocs?: boolean;
  copyFrom?: string;
}

export interface SchemaField {
  name: string;
  type: string;
  stored: boolean;
  indexed: boolean;
  uninvertible?: boolean;
  docValues?: boolean;
  multiValued?: boolean;
  required?: boolean;
  default?: string;
  tokenized?: boolean;
  [key: string]: any;
}

export interface SchemaFieldType {
  name: string;
  class: string;
  indexed?: boolean;
  stored?: boolean;
  multiValued?: boolean;
  docValues?: boolean;
  tokenized?: boolean;
  [key: string]: any;
}

export interface SchemaDesignerConfigSetsResponse {
  configSets: { [name: string]: number };
}

export interface SchemaDesignerInfoResponse {
  configSet: string;
  fields: SchemaField[];
  fieldTypes: SchemaFieldType[];
  collections: string[];
  numDocs: number;
  published: boolean;
  uniqueKeyField: string;
  schemaVersion: number;
  enableDynamicFields?: boolean;
  enableFieldGuessing?: boolean;
  enableNestedDocs?: boolean;
  languages?: string[];
  copyFrom?: string;
  [key: string]: any;
}
