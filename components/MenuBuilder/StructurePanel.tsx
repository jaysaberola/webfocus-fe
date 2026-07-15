"use client";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { FlatItem } from "./types";
import { buildTree, INDENT } from "./treeUtils";
import SortableItem from "./SortableItem";

interface StructurePanelProps {
  flatItems: FlatItem[];
  onChange: (items: FlatItem[]) => void;
}

export default function StructurePanel({
  flatItems,
  onChange,
}: StructurePanelProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    if (!over) return;

    const oldIndex = flatItems.findIndex((i) => i.id === active.id);
    const newIndex = flatItems.findIndex((i) => i.id === over.id);

    let newFlat = arrayMove(flatItems, oldIndex, newIndex);

    const depthChange = Math.round(delta.x / INDENT);
    const newDepth = Math.max(0, newFlat[newIndex].depth + depthChange);

    newFlat[newIndex] = {
      ...newFlat[newIndex],
      depth: newDepth,
      parentId:
        newDepth === 0 ? null : newFlat[newIndex - 1]?.id ?? null,
    };

    onChange(newFlat);
  };

  return (
    <div className="border rounded p-3">
      <h6>Structure</h6>
      <small className="text-muted">
        Drag up/down to reorder. Drag right to create sub-menu.
      </small>

      <div className="mt-3">
        {flatItems.length === 0 && (
          <div className="text-muted">No menu items yet</div>
        )}

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={flatItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {flatItems.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                onUpdate={onChange}
                onRemove={(id) =>
                  onChange(flatItems.filter((i) => i.id !== id))
                }
                flatItems={flatItems}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
