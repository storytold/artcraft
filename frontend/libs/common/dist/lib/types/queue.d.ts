import { CameraAspectRatio, fromEngineActions, QueueNames, toEngineActions, toTimelineActions } from '../enums';
import { IGenerationOptions, MediaItem, QueueClip, QueueKeyframe, UpdateTime } from '../interfaces';
import { ToastDataType } from './toast';
export type UnionedActionTypes = fromEngineActions | toEngineActions | toTimelineActions;
export type UnionedDataTypes = QueueClip | UpdateTime | QueueKeyframe | MediaItem | ToastDataType | IGenerationOptions | CameraAspectRatio | null;
export type QueueSubscribeType = {
    action: UnionedActionTypes;
    data: UnionedDataTypes;
};
export type SubscribeHandler = (entry: {
    action: UnionedActionTypes;
    data: UnionedDataTypes;
}) => void;
declare class Queue {
    private _queues;
    private _subscribers;
    publish({ queueName, action, data, }: {
        queueName: QueueNames;
        action: UnionedActionTypes;
        data: UnionedDataTypes;
    }): void;
    subscribe(queueName: QueueNames, id: string, onMessage: (entry: QueueSubscribeType) => void): void;
}
declare const queue: Queue;
export default queue;
//# sourceMappingURL=queue.d.ts.map