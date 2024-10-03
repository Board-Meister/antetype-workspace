import type { IInjectable } from "@boardmeister/marshal"
import type { Minstrel } from "@boardmeister/minstrel"
import type { Herald } from "@boardmeister/herald"

interface IInjected extends Record<string, object> {
  minstrel: Minstrel;
  herald: Herald;
}

const Skeleton: IInjectable = class {
  injected?: IInjected;

  static inject: Record<string, string> = {
    minstrel: 'boardmeister/minstrel',
    herald: 'boardmeister/herald',
  }
  inject(injections: IInjected): void {
    this.injected = injections;
  }
}

export default Skeleton;
