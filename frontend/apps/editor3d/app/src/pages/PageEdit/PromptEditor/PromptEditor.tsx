import React from "react";
import { PromptBoxEdit, PromptBoxEditProps } from "@storyteller/ui-promptbox";

const PromptEditor: React.FC<PromptBoxEditProps> = (props) => {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col space-y-2">
      <PromptBoxEdit {...props} />
    </div>
  );
};

export default React.memo(PromptEditor);
