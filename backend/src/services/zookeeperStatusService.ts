import axios from "axios";
import { ZookeeperStatusResponse } from "../interfaces/zookeeperStatusResponse";

export class ZookeeperStatusService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getZookeeperStatus(): Promise<ZookeeperStatusResponse> {
    const response = await axios.get(`${this.baseUrl}/solr/admin/zookeeper/status`);
    return response.data as ZookeeperStatusResponse;
  }
}
