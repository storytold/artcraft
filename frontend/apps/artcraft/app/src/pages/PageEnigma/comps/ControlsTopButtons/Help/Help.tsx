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
  <div className="flex gap-1">{props.children}</div>
);

export const Mouse = (props: {
  button: "left" | "middle" | "right";
  label?: string;
}) => (
  <div className="flex items-center gap-2.5">
    <img
      alt={`${props.button} mouse`}
      src={`/resources/icons/mouse_${props.button === "left" ? "lmb" : props.button === "middle" ? "mmb" : "rmb"}.png`}
      className="h-7 w-auto object-contain"
    />
    <span className="text-sm font-normal opacity-60">{props.label}</span>
  </div>
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
