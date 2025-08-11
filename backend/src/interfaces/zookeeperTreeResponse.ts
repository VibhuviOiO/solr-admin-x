export interface ZookeeperNode {
  text: string;
  a_attr: {
    href: string;
  };
  children?: ZookeeperNode[];
  ephemeral?: boolean;
  version?: number;
}

export interface ZookeeperTreeResponse {
  tree: ZookeeperNode[];
}
