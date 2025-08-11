// Service for Schema Designer API logic
import { SchemaConfigSet, SchemaField, SchemaFieldType, SchemaDesignerConfigSetsResponse, SchemaDesignerInfoResponse } from '../interfaces/schemaDesigner';

export class SchemaDesignerService {
  // In-memory store for demonstration; replace with DB or Solr API integration
  private configSets: { [name: string]: SchemaConfigSet } = {};
  private fields: { [configSet: string]: SchemaField[] } = {};
  private fieldTypes: { [configSet: string]: SchemaFieldType[] } = {};

  getConfigSets(): SchemaDesignerConfigSetsResponse {
    // 1 = published, 0 = not published
    const configSets: { [name: string]: number } = {};
    Object.keys(this.configSets).forEach(name => {
      configSets[name] = this.configSets[name].published ? 1 : 0;
    });
    return { configSets };
  }

  createConfigSet(name: string, copyFrom?: string): SchemaConfigSet {
    if (this.configSets[name]) throw new Error('Config set already exists');
    const base: SchemaConfigSet = {
      name,
      published: false,
      editable: true,
      collections: [],
      numDocs: 0,
      languages: ['*'],
      enableDynamicFields: true,
      enableFieldGuessing: true,
      enableNestedDocs: false,
      copyFrom: copyFrom || '_default',
    };
    this.configSets[name] = base;
    this.fields[name] = copyFrom && this.fields[copyFrom] ? [...this.fields[copyFrom]] : [];
    this.fieldTypes[name] = copyFrom && this.fieldTypes[copyFrom] ? [...this.fieldTypes[copyFrom]] : [];
    return base;
  }

  getConfigSetInfo(configSet: string): SchemaDesignerInfoResponse {
    const set = this.configSets[configSet];
    if (!set) throw new Error('Config set not found');
    return {
      configSet: set.name,
      fields: this.fields[configSet] || [],
      fieldTypes: this.fieldTypes[configSet] || [],
      collections: set.collections || [],
      numDocs: set.numDocs || 0,
      published: set.published,
      uniqueKeyField: 'id',
      schemaVersion: 1,
      enableDynamicFields: set.enableDynamicFields,
      enableFieldGuessing: set.enableFieldGuessing,
      enableNestedDocs: set.enableNestedDocs,
      languages: set.languages,
      copyFrom: set.copyFrom,
    };
  }

  // Add more methods for analyze, add, update, publish, diff, file, sample, query, etc.
}

export const schemaDesignerService = new SchemaDesignerService();
