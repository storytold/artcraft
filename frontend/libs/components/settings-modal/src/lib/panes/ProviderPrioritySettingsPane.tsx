import { useEffect, useState, ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, LoaderCircleIcon } from "lucide-react";
import {
  SetProviderOrder,
  Provider,
  GetProviderOrder,
} from "@storyteller/tauri-api";
import { getCreatorIcon, ModelCreator } from "@storyteller/model-list";
import { IsDesktopApp } from "@storyteller/tauri-utils";
import { buildProviderPriorityItems } from "./provider-priority-items";
import type { ProviderItem } from "./provider-priority-items";

interface SortableItemProps {
  id: string;
  name: string;
  icon: ReactNode;
  isUpdating?: boolean;
}

const SortableItem = ({
  id,
  name,
  icon,
  isUpdating = false,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center justify-between rounded-lg p-3 transition-colors duration-200 border border-ui-controls-border bg-ui-controls/60 text-base-fg
        ${
          isUpdating
            ? "opacity-60 cursor-not-allowed"
            : "cursor-move hover:bg-ui-controls/80"
        }
        ${isDragging ? "opacity-70 shadow-lg" : ""}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center h-4 w-4">
          {icon}
        </span>
        <span className="font-medium">{name}</span>
      </div>
      <div className="flex items-center">
        <GripVerticalIcon
          
          className="text-base-fg/40 text-sm" />
      </div>
    </div>
  );
};

const PROVIDER_TO_CREATOR: Partial<Record<Provider, ModelCreator>> = {
  [Provider.ArtCraft]: ModelCreator.ArtCraft,
  [Provider.Fal]: ModelCreator.Fal,
  [Provider.Sora]: ModelCreator.OpenAi,
};

const getProviderIcon = (provider: Provider): ReactNode => {
  const creator = PROVIDER_TO_CREATOR[provider];
  if (creator) return getCreatorIcon(creator, "h-4 w-4 icon-auto-contrast");
  return (
    <img
      src={
        IsDesktopApp()
          ? "/resources/images/services/generic.svg"
          : "/images/services/generic.svg"
      }
      alt="generic logo"
      className="h-4 w-4 icon-auto-contrast"
    />
  );
};

export const ProviderPrioritySettingsPane = () => {
  const [items, setItems] = useState<ProviderItem[]>([]);

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const providers = await GetProviderOrder();

      setItems(buildProviderPriorityItems(providers.payload.providers));
    };
    fetchData();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateProviderPriorityOnBackend = async (newOrder: ProviderItem[]) => {
    try {
      setIsUpdating(true);
      console.log("Updating provider priority on backend:", newOrder);

      let ordering = newOrder.map((item) => item.id);
      console.log("Provider order:", ordering);

      await SetProviderOrder({ providers: ordering });

      console.log("Provider priority updated successfully");
    } catch (error) {
      console.error("Failed to update provider priority:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((item) => item.id === active.id);
        const newIndex = prevItems.findIndex((item) => item.id === over?.id);

        const newOrder = arrayMove(prevItems, oldIndex, newIndex);

        // Send update to backend
        updateProviderPriorityOnBackend(newOrder);

        return newOrder;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-base-fg/70 mb-4">
          Drag and drop to reorder model provider priority. Higher items will be
          tried first. You can use this to control favorite services and
          spending.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableItem
                key={item.id}
                id={item.id}
                name={item.name}
                icon={getProviderIcon(item.id)}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isUpdating && (
        <div className="text-xs rounded-full animate-pulse mt-4 flex items-center gap-2 text-base-fg/70">
          <LoaderCircleIcon  className="animate-spin" />
          Updating...
        </div>
      )}
    </div>
  );
};
