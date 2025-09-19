import { Howl } from 'howler';
export interface Args {
    defaultVolume?: number;
}
export declare class SoundEffect {
    readonly soundUrl: string;
    readonly defaultVolume: number;
    readonly howlerSound: Howl;
    constructor(soundUrl: string, args?: Args);
    play(): void;
}
//# sourceMappingURL=SoundEffect.d.ts.map