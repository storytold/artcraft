import { CameraAspectRatio, fromEngineActions, QueueNames, toEngineActions, toTimelineActions } from "../enums";
import { IGenerationOptions, MediaItem, QueueClip, QueueKeyframe, UpdateTime } from "../interfaces";
import { ToastDataType } from "./toast";

export type UnionedActionTypes =
  | fromEngineActions
  | toEngineActions
  | toTimelineActions;

export type UnionedDataTypes =
  | QueueClip
  | UpdateTime
  | QueueKeyframe
  | MediaItem
  | ToastDataType
  | IGenerationOptions
  | CameraAspectRatio
  | null;

export type QueueSubscribeType = {
  action: UnionedActionTypes;
  data: UnionedDataTypes;
};

export type SubscribeHandler = (entry: {
  action: UnionedActionTypes;
  data: UnionedDataTypes;
}) => void;

class Queue {
  private _queues: Record<
    QueueNames,
    Array<{
      action: UnionedActionTypes;
      data: UnionedDataTypes;
    }>
  > = {
      [QueueNames.FROM_ENGINE]: [],
      [QueueNames.TO_ENGINE]: [],
      [QueueNames.TO_TIMELINE]: []
    };

  private _subscribers: Record<
    QueueNames,
    Map<
      string,
      SubscribeHandler
    >
  > = {
      [QueueNames.FROM_ENGINE]: new Map<string, SubscribeHandler>(),
      [QueueNames.TO_ENGINE]: new Map<string, SubscribeHandler>(),
      [QueueNames.TO_TIMELINE]: new Map<string, SubscribeHandler>(),
    };

  // Enqueues actions to a specified queue
  public publish({
    queueName,
    action,
    data,
  }: {
    queueName: QueueNames;
    action: UnionedActionTypes;
    data: UnionedDataTypes;
  }) {
    // Queues for all QueueNames should be initialized above but this is a safeguard for future enum additions
    // Make sure the queue exists
    if (!this._queues[queueName]) {
      this._queues[queueName] = [];
    }

    // Queue the task in the right queue
    this._queues[queueName].push({ action, data });

    // TODO: Ideally the publisher shouldn't deal at all with the subscribers
    // It should only publish the events to the right queue
    // It also doesn't make sense to fire an event on publish because the operations are then dispersed
    // leading to potential race conditions
    // FIXME: Add some sort of queue loop using internal event and add queue locks using promises to serialize queue publishes
    if (this._subscribers[queueName]) {
      this._subscribers[queueName].forEach((subcribeHandler) =>
        subcribeHandler(this._queues[queueName][0]),
      );
      this._queues[queueName].shift();
    }
  }

  public subscribe(
    queueName: QueueNames,
    id: string,
    onMessage: (entry: QueueSubscribeType) => void,
  ) {

    // Queues for all QueueNames should be initialized above but this is a safeguard for future enum additions
    // Make sure the queue exists
    if (!this._subscribers[queueName]) {
      this._subscribers[queueName] = new Map<string, SubscribeHandler>();
    }

    // Set the handler mapped to the ID
    this._subscribers[queueName].set(id, onMessage);

    while (this._queues[queueName]?.length) {
      this._subscribers[queueName].forEach((subscribeHandler) =>
        subscribeHandler(this._queues[queueName][0]),
      );
      this._queues[queueName].shift();
    }
  }
}

const queue = new Queue();

export default queue;
