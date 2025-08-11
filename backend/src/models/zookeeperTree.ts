import { ZookeeperNode, ZookeeperTreeResponse } from "../interfaces/zookeeperTreeResponse";

export class ZookeeperNodeModel implements ZookeeperNode {
  text: string;
  a_attr: { href: string };
  children?: ZookeeperNodeModel[];
  ephemeral?: boolean;
  version?: number;

  constructor(data: ZookeeperNode) {
    this.text = data.text;
    this.a_attr = data.a_attr;
    this.ephemeral = data.ephemeral;
    this.version = data.version;
    if (data.children) {
      this.children = data.children.map(child => new ZookeeperNodeModel(child));
    }
  }
}

export class ZookeeperTreeModel implements ZookeeperTreeResponse {
  tree: ZookeeperNodeModel[];

  constructor(data: ZookeeperTreeResponse) {
    this.tree = data.tree.map(node => new ZookeeperNodeModel(node));
  }
}
