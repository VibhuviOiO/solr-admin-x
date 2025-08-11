import axios from 'axios';
import { LoggingInfoResponse } from '../interfaces/loggingInfoResponse';
import { getNodeUrl } from '../models/loggingInfoModel';

export async function getLoggingInfo(node: string): Promise<LoggingInfoResponse> {
  const nodeUrl = getNodeUrl(node);
  const url = `${nodeUrl}/admin/info/logging?wt=json&since=0`;
  const response = await axios.get<LoggingInfoResponse>(url);
  return response.data;
}
