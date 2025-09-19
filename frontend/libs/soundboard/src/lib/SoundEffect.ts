import {Howl} from 'howler';

export interface Args {
  defaultVolume?: number;
}

export class SoundEffect {

  readonly soundUrl: string;
  readonly defaultVolume: number;
  readonly howlerSound: Howl;

  constructor(soundUrl: string, args?: Args) {
    const defaultVolume = args?.defaultVolume || 1.0;
    
    this.soundUrl = soundUrl;
    this.defaultVolume = defaultVolume;
    this.howlerSound = new Howl({
      src: [soundUrl],
      autoplay: false,
      loop: false,
      volume: defaultVolume,
    });
  }

  public play() {
    this.howlerSound.play();
  }
}
