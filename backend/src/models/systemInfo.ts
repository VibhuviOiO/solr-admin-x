import { SystemInfoResponse } from "../interfaces/systemInfoResponse";

// Model for System Info (can be extended for DB or ORM if needed)
export class SystemInfo implements SystemInfoResponse {
  responseHeader;
  mode;
  zkHost;
  solr_home;
  core_root;
  lucene;
  jvm;
  security;
  system;
  node;

  constructor(data: SystemInfoResponse) {
    this.responseHeader = data.responseHeader;
    this.mode = data.mode;
    this.zkHost = data.zkHost;
    this.solr_home = data.solr_home;
    this.core_root = data.core_root;
    this.lucene = data.lucene;
    this.jvm = data.jvm;
    this.security = data.security;
    this.system = data.system;
    this.node = data.node;
  }
}
