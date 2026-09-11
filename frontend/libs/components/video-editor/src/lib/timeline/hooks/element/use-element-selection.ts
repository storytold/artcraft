import { useCallback } from "react";
import { useEditor } from "../../../editor/use-editor";
import type { ElementRef } from "../../types";

export function useElementSelection() {
  const editor = useEditor();
  const selectedElements = useEditor((e) => e.selection.getSelectedElements());

  const isElementSelected = useCallback(
    ({ trackId, elementId }: ElementRef) =>
      selectedElements.some(
        (element) =>
          element.trackId === trackId && element.elementId === elementId,
      ),
    [selectedElements],
  );

  const selectElement = useCallback(
    ({ trackId, elementId }: ElementRef) => {
      editor.selection.setSelectedElements({
        elements: [{ trackId, elementId }],
      });
    },
    [editor],
  );

  const addElementToSelection = useCallback(
    ({ trackId, elementId }: ElementRef) => {
      const alreadySelected = selectedElements.some(
        (element) =>
          element.trackId === trackId && element.elementId === elementId,
      );
      if (alreadySelected) return;

      editor.selection.setSelectedElements({
        elements: [...selectedElements, { trackId, elementId }],
      });
    },
    [selectedElements, editor],
  );

  const removeElementFromSelection = useCallback(
    ({ trackId, elementId }: ElementRef) => {
      editor.selection.setSelectedElements({
        elements: selectedElements.filter(
          (element) =>
            !(element.trackId === trackId && element.elementId === elementId),
        ),
      });
    },
    [selectedElements, editor],
  );

  const toggleElementSelection = useCallback(
    ({ trackId, elementId }: ElementRef) => {
      const alreadySelected = selectedElements.some(
        (element) =>
          element.trackId === trackId && element.elementId === elementId,
      );

      if (alreadySelected) {
        removeElementFromSelection({ trackId, elementId });
      } else {
        addElementToSelection({ trackId, elementId });
      }
    },
    [selectedElements, addElementToSelection, removeElementFromSelection],
  );

  const clearElementSelection = useCallback(() => {
    editor.selection.clearSelection();
  }, [editor]);

  const setElementSelection = useCallback(
    ({ elements }: { elements: ElementRef[] }) => {
      editor.selection.setSelectedElements({ elements });
    },
    [editor],
  );


  /**
   * Merges elements into the current selection, deduplicating by identity.
   * Used for additive box-select where the pre-drag selection is preserved.
   */
  const mergeElementsIntoSelection = useCallback(
    ({ elements }: { elements: ElementRef[] }) => {
      const merged = [
        ...selectedElements.filter(
          (selectedElement) =>
            !elements.some(
              (element) =>
                element.trackId === selectedElement.trackId &&
                element.elementId === selectedElement.elementId,
            ),
        ),
        ...elements,
      ];
      editor.selection.setSelectedElements({ elements: merged });
    },
    [selectedElements, editor],
  );


  /**
   * Handles click interaction on an element.
   * - Regular click: select only this element
   * - Multi-key click (Ctrl/Cmd): toggle this element in selection
   */
  const handleElementClick = useCallback(
    ({
      trackId,
      elementId,
      isMultiKey,
    }: ElementRef & { isMultiKey: boolean }) => {
      if (isMultiKey) {
        toggleElementSelection({ trackId, elementId });
      } else {
        selectElement({ trackId, elementId });
      }
    },
    [toggleElementSelection, selectElement],
  );

  return {
    selectedElements,
    isElementSelected,
    selectElement,
    setElementSelection,
    mergeElementsIntoSelection,
    addElementToSelection,
    removeElementFromSelection,
    toggleElementSelection,
    clearElementSelection,
    handleElementClick,
  };
}
