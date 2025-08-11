import axios from 'axios';
import { LoggingLevelDefinition } from '../interfaces/loggingLevelDefinition';
import { getNodeUrl } from '../models/loggingInfoModel';

export async function getLoggingLevels(node: string): Promise<LoggingLevelDefinition> {
  const nodeUrl = getNodeUrl(node);
  const url = `${nodeUrl}/admin/info/logging?wt=json`;
  const response = await axios.get<LoggingLevelDefinition>(url);
  return response.data;
}
