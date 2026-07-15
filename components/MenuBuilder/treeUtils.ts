import { FlatItem, MenuItem } from "./types";

export const INDENT = 30;

export const readOpenInNewTab = (item: any) => {
  const value =
    item?.openInNewTab ??
    item?.open_in_new_tab ??
    item?.newTab ??
    item?.targetBlank ??
    item?.target_blank ??
    item?.targetAttr ??
    item?.target_attr;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "_blank";
  }
  return value === true || value === 1;
};

export const serializeMenuTree = (items: MenuItem[]): any[] =>
  items.map((item) => {
    const openInNewTab = readOpenInNewTab(item);
    const nextItem: any = {
      id: item.id,
      label: item.label,
      type: item.type,
      target: item.target,
      children: serializeMenuTree(item.children || []),
    };

    if (item.type === "url") {
      nextItem.openInNewTab = openInNewTab;
      nextItem.open_in_new_tab = openInNewTab;
      nextItem.newTab = openInNewTab;
      nextItem.targetBlank = openInNewTab;
      nextItem.target_blank = openInNewTab;
      nextItem.targetAttr = openInNewTab ? "_blank" : undefined;
      nextItem.target_attr = openInNewTab ? "_blank" : undefined;
    }

    return nextItem;
  });

export const flattenTree = (
  items: MenuItem[],
  depth = 0,
  parentId: number | null = null
): FlatItem[] =>
  items.flatMap((item) => [
    {
      id: item.id,
      label: item.label,
      type: item.type,
      target: item.target,
      openInNewTab: readOpenInNewTab(item),
      depth,
      parentId,
    },
    ...flattenTree(item.children, depth + 1, item.id),
  ]);

export const buildTree = (flat: FlatItem[]): MenuItem[] => {
  const root: MenuItem[] = [];
  const map = new Map<number, MenuItem>();

  flat.forEach((i) =>
    map.set(i.id, {
      id: i.id,
      label: i.label,
      type: i.type,
      target: i.target,
      openInNewTab: readOpenInNewTab(i),
      children: [],
    })
  );

  flat.forEach((i) => {
    const node = map.get(i.id)!;
    if (i.parentId === null) {
      root.push(node);
    } else {
      map.get(i.parentId)?.children.push(node);
    }
  });

  return root;
};
