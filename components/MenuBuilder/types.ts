export type MenuItemType = "page" | "url";

export type Page = {
  id: number;
  title: string;
  slug: string;
};

export type MenuItem = {
  id: number;
  label: string;
  type: MenuItemType;
  target?: string; // URL for custom links
  openInNewTab?: boolean;
  children: MenuItem[];
};

export type FlatItem = {
  id: number;
  label: string;
  type: MenuItemType;
  target?: string;
  openInNewTab?: boolean;
  depth: number;
  parentId: number | null;
};
