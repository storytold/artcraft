import { Label } from "@storyteller/ui-label";

export const ShortcutsGroup = (props: {
  label: string;
  children?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <Label className="text-md font-semibold" {...props}>
      {props.label}
    </Label>
    <div className="relative flex flex-col gap-2.5">
      {props.children}
      <div className="absolute top-0 h-full w-0.5 bg-white/15" />
    </div>
  </div>
);

export const Shortcut = (props: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-2 ps-4">
    <span className="text-md w-[280px] font-medium opacity-80">
      {props.label}
    </span>
    {props.children}
  </div>
);

export const Key = (props: { button: string }) => (
  <div className="flex h-[30px] w-auto min-w-[30px] items-center justify-center rounded-md border-b-2 border-[#9E9EA6] bg-white px-2 text-center text-sm font-bold text-ui-background">
    {props.button}
  </div>
);

export const KeyGroup = (props: { children: React.ReactNode }) => (
  <div className="flex items-center gap-1">{props.children}</div>
);

// Inline SVG instead of /resources/icons/mouse_*.png. The PNGs only
// ship with the Tauri host's public dir, so the webapp host showed a
// broken-image placeholder. Inlining keeps the lib self-contained and
// renders identically across both apps.
export const Mouse = (props: {
  button: "left" | "middle" | "right";
  label?: string;
}) => (
  <div className="flex items-center gap-2.5">
    <MouseIcon active={props.button} />
    <span className="text-sm font-normal opacity-60">{props.label}</span>
  </div>
);

const MouseIcon = ({ active }: { active: "left" | "middle" | "right" }) => (
  <svg
    viewBox="0 0 20 28"
    aria-hidden
    className="h-7 w-auto text-white"
  >
    <rect
      x="1.25"
      y="1.25"
      width="17.5"
      height="25.5"
      rx="8.75"
      ry="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.85"
    />
    {active === "left" && (
      <path
        d="M9 1.75 V12 H1.5 V10 A8.5 8.5 0 0 1 9 1.75 Z"
        fill="currentColor"
      />
    )}
    {active === "right" && (
      <path
        d="M11 1.75 V12 H18.5 V10 A8.5 8.5 0 0 0 11 1.75 Z"
        fill="currentColor"
      />
    )}
    <rect
      x="9"
      y="4"
      width="2"
      height="5"
      rx="1"
      fill="currentColor"
      opacity={active === "middle" ? "1" : "0.5"}
    />
    <line
      x1="1.5"
      y1="12"
      x2="18.5"
      y2="12"
      stroke="currentColor"
      strokeWidth="0.75"
      opacity="0.4"
    />
  </svg>
);

export const Plus = () => <div className="text-xl font-medium">+</div>;

const ShortcutsView = () => (
  <div className="grid select-none grid-cols-2 gap-12 ps-4 mt-6">
    <div className="flex flex-col gap-8">
      <ShortcutsGroup label="Navigation">
        <Shortcut label="Orbit View">
          <KeyGroup>
            <Mouse button="left" label="(Hold)" />
          </KeyGroup>
        </Shortcut>
        <Shortcut label="Forward Backward">
          <KeyGroup>
            <Key button="W" />
            <Key button="S" />
          </KeyGroup>
        </Shortcut>
        <Shortcut label="Left Right">
          <KeyGroup>
            <Key button="A" />
            <Key button="D" />
          </KeyGroup>
        </Shortcut>
        <Shortcut label="Up Down">
          <KeyGroup>
            <Key button="E" />
            <Key button="Q" />
          </KeyGroup>
        </Shortcut>
        <Shortcut label="Speed Boost">
          <KeyGroup>
            <Key button="Shift" />
            <span className="ml-1.5 text-sm font-normal opacity-60">(Hold)</span>
          </KeyGroup>
        </Shortcut>
        <Shortcut label="Slow Movement">
          <KeyGroup>
            <Key button="Alt" />
            <span className="ml-1.5 text-sm font-normal opacity-60">(Hold)</span>
          </KeyGroup>
        </Shortcut>
      </ShortcutsGroup>

      <ShortcutsGroup label="Interaction">
        <Shortcut label="Select Object">
          <Mouse button="left" label="(Click)" />
        </Shortcut>
        <Shortcut label="Delete Selection">
          <Key button="Del" />
        </Shortcut>
      </ShortcutsGroup>
    </div>

    <div className="flex flex-col gap-8">
      <ShortcutsGroup label="Shortcuts">
        <Shortcut label="Transform">
          <Key button="T" />
        </Shortcut>
        <Shortcut label="Rotate">
          <Key button="R" />
        </Shortcut>
        <Shortcut label="Scale">
          <Key button="G" />
        </Shortcut>
        <Shortcut label="Focus">
          <Key button="F" />
        </Shortcut>
        <Shortcut label="Copy">
          <Key button="Ctrl" />
          <Plus></Plus>
          <Key button="C" />
        </Shortcut>
        <Shortcut label="Paste">
          <Key button="Ctrl" />
          <Plus></Plus>
          <Key button="Shift" />
          <Plus></Plus>
          <Key button="V" />
        </Shortcut>
        <Shortcut label="Open 3D Asset Modal">
          <Key button="B" />
        </Shortcut>
      </ShortcutsGroup>
    </div>
  </div>
);



export const Help = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <ShortcutsView />
      </div>
    </div>
  );
};
