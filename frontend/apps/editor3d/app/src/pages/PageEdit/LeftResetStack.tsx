import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faTrashXmark } from "@fortawesome/pro-solid-svg-icons";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  showActionReminder,
  isActionReminderOpen,
} from "@storyteller/ui-action-reminder-modal";

interface LeftResetStackProps {
  onReset: () => void;
  className?: string;
}

const LeftResetStack: React.FC<LeftResetStackProps> = ({
  onReset,
  className = "",
}) => {
  return (
    <div
      className={`glass rounded-xl border-2 border-red/50 shadow-lg hover:border-red/80 ${className}`}
    >
      <div className="relative h-full">
        <Tooltip
          content="Reset All"
          position="right"
          closeOnClick={true}
          className="ms-1 rounded-md bg-red px-3 py-1"
          delay={100}
        >
          <button
            className="text-base-fg flex h-10 w-10 items-center justify-center rounded-lg border-2 border-transparent transition-colors hover:bg-red/50"
            onClick={() =>
              showActionReminder({
                reminderType: "default",
                title: "Reset All",
                primaryActionIcon: faTrashXmark,
                primaryActionBtnClassName: "bg-red hover:bg-red/80",
                message: (
                  <p className="text-base-fg text-sm opacity-70">
                    Are you sure you want to reset all? This will clear all your
                    work and cannot be undone.
                  </p>
                ),
                primaryActionText: "Reset all",
                onPrimaryAction: () => {
                  onReset();
                  isActionReminderOpen.value = false;
                },
              })
            }
          >
            <FontAwesomeIcon icon={faXmark} className="h-5 w-5 text-xl" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default LeftResetStack;
