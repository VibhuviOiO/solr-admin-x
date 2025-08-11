import axios from 'axios';
import { ZookeeperTreeResponse } from '../interfaces/zookeeperTreeResponse';

export class ZookeeperTreeService {
  constructor(private baseUrl: string) {}

  async getZookeeperTree(): Promise<ZookeeperTreeResponse> {
    const url = `${this.baseUrl}/solr/admin/zookeeper?wt=json`;
    const response = await axios.get(url);
  // The Solr API returns the tree as { tree: [...] }
  return response.data as ZookeeperTreeResponse;
  }
}
