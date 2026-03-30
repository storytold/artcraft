import { signal } from "@preact/signals-core";

export const ignoreKeyDelete = signal(false);

export enum DomLevels {
  NONE,
  INPUT,
  PANEL,
  DIALOGUE,
}
type HotkeysStatusType = {
  disabled: boolean,
  disabledBy: DomLevels,
}
export const hotkeysStatus = signal<HotkeysStatusType>({
  disabled:false,
  disabledBy:DomLevels.NONE,
});

export const isHotkeyDisabled = ()=>{
  return hotkeysStatus.value.disabled;
}
export const disableHotkeyInput = (level: number)=>{
  if(hotkeysStatus.value.disabled === true){
    if (level > hotkeysStatus.value.disabledBy){
      hotkeysStatus.value = { ...hotkeysStatus.value, disabledBy: level };
    }
  }else{
    hotkeysStatus.value = {
      disabled: true,
      disabledBy: level,
    }
  }
}
export const enableHotkeyInput = (level: number)=>{
  if(hotkeysStatus.value.disabled === true){
    if (level >= hotkeysStatus.value.disabledBy){
      hotkeysStatus.value = {
        disabled: false,
        disabledBy: DomLevels.NONE,
      }
    }
  }
}
