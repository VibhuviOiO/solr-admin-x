import axios from 'axios';
import { MetricsResponse } from '../interfaces/metricsResponse';

export async function fetchMetrics(baseUrl: string): Promise<MetricsResponse> {
  const url = `${baseUrl}/admin/metrics`;
  const response = await axios.get<MetricsResponse>(url);
  return response.data;
}
