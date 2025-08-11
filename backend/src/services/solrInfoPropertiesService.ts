// Service to fetch Solr Info Properties from Solr API
import axios from 'axios';
import { SolrInfoPropertiesResponse } from '../interfaces/solrInfoPropertiesResponse';

const SOLR_URL = process.env.SOLR_URL || 'http://localhost:8983/solr/admin/info/properties';

export class SolrInfoPropertiesService {
  async getInfoProperties(): Promise<SolrInfoPropertiesResponse> {
    const response = await axios.get<SolrInfoPropertiesResponse>(SOLR_URL);
    return response.data;
  }
}

export const solrInfoPropertiesService = new SolrInfoPropertiesService();
