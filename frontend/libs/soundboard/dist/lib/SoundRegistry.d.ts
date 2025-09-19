import { SoundEffect } from './SoundEffect';
export declare class SoundRegistry {
    #private;
    private constructor();
    static getInstance(): SoundRegistry;
    hasSound(key: string): boolean;
    setSound(key: string, sound: SoundEffect): void;
    setSoundOnce(key: string, sound: SoundEffect): void;
    getSound(key: string): SoundEffect | undefined;
    playSound(key: string): void;
}
//# sourceMappingURL=SoundRegistry.d.ts.map