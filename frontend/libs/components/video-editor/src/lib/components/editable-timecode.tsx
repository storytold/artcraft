"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatTimecode,
  type FrameRate,
  type TimeCodeFormat,
} from "opencut-wasm";
import { cn } from "../utils/ui";
import {
  parseMediaTimecode,
  snapSeekMediaTime,
  type MediaTime,
} from "../wasm";

interface EditableTimecodeProps {
  time: MediaTime;
  duration: MediaTime;
  format?: TimeCodeFormat;
  fps: FrameRate;
  onTimeChange?: ({ time }: { time: MediaTime }) => void;
  className?: string;
  disabled?: boolean;
}

export function EditableTimecode({
  time,
  duration,
  format = "HH:MM:SS:FF",
  fps,
  onTimeChange,
  className,
  disabled = false,
}: EditableTimecodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const enterPressedRef = useRef(false);
  const formattedTime = formatTimecode({ time, format, rate: fps }) ?? "";

  const startEditing = () => {
    if (disabled) return;
    setIsEditing(true);
    setInputValue(formattedTime);
    setHasError(false);
    enterPressedRef.current = false;
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setInputValue("");
    setHasError(false);
    enterPressedRef.current = false;
  };

  const applyEdit = () => {
    const parsedTime = parseMediaTimecode({
      timeCode: inputValue,
      format,
      fps,
    });

    if (parsedTime == null) {
      setHasError(true);
      return;
    }

    const clampedTime = duration
      ? snapSeekMediaTime({ time: parsedTime, duration, fps })
      : parsedTime;

    onTimeChange?.({ time: clampedTime });
    setIsEditing(false);
    setInputValue("");
    setHasError(false);
    enterPressedRef.current = false;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      enterPressedRef.current = true;
      applyEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  };

  const handleInputChange = ({
    target,
  }: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(target.value);
    setHasError(false);
  };

  const handleBlur = () => {
    if (!enterPressedRef.current && isEditing) {
      applyEdit();
    }
  };

  const handleDisplayKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startEditing();
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          "-mx-1 border border-transparent bg-transparent px-1 font-mono text-xs outline-none",
          "focus:bg-background focus:border-primary focus:rounded",
          "text-primary tabular-nums",
          hasError && "text-destructive focus:border-destructive",
          className,
        )}
        style={{ width: `${formattedTime.length + 1}ch` }}
        placeholder={formattedTime}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      onKeyDown={handleDisplayKeyDown}
      disabled={disabled}
      className={cn(
        "text-primary cursor-pointer font-mono text-xs tabular-nums",
        "hover:bg-muted/50 -mx-1 px-1 hover:rounded",
        disabled && "cursor-default hover:bg-transparent",
        className,
      )}
      title={disabled ? undefined : "Click to edit time"}
    >
      {formattedTime}
    </button>
  );
}
