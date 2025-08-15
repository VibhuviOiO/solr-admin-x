import React from "react";

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  path: string;
}

interface TreeProps {
  data: TreeNode[];
  onSelect: (path: string) => void;
  selected: string | null;
}

export const Tree: React.FC<TreeProps> = ({ data, onSelect, selected }) => {
  const renderTree = (nodes: TreeNode[]) => (
    <ul className="pl-4">
      {nodes.map((node) => (
        <li key={node.id}>
          <div
            className={`cursor-pointer py-1 px-2 rounded hover:bg-accent ${selected === node.path ? "bg-accent text-accent-foreground" : ""}`}
            onClick={() => onSelect(node.path)}
          >
            {node.label}
          </div>
          {node.children && node.children.length > 0 && renderTree(node.children)}
        </li>
      ))}
    </ul>
  );
  return <div>{renderTree(data)}</div>;
};
