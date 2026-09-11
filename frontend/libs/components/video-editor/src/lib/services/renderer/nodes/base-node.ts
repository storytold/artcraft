export type BaseNodeParams = object | undefined;
export type AnyBaseNode = BaseNode<BaseNodeParams, unknown>;

export class BaseNode<
  Params extends BaseNodeParams = BaseNodeParams,
  Resolved = unknown,
> {
  params: Params;
  resolved: Resolved | null = null;

  constructor(params?: Params) {
    this.params = params ?? ({} as Params);
  }

  children: AnyBaseNode[] = [];

  add(child: AnyBaseNode) {
    this.children.push(child);
    return this;
  }

  remove(child: AnyBaseNode) {
    this.children = this.children.filter((c) => c !== child);
    return this;
  }
}
