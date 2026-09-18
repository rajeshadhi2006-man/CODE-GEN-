export type BusEventType = 
  | 'DISRUPTION_DETECTED'
  | 'AI_OPTIMIZATION_STARTED'
  | 'CANDIDATE_STREAMED'
  | 'RECOMMENDATION_GENERATED'
  | 'REALLOCATION_APPROVED'
  | 'SLA_UPDATED'
  | 'AUDIT_LOG_WRITTEN'
  | 'NOTIFICATION_RECEIVED';

export interface BusEvent<T = any> {
  type: BusEventType;
  payload: T;
  timestamp: string;
}

type BusListener<T = any> = (event: BusEvent<T>) => void;

class RealtimeBusService {
  private target: EventTarget;

  constructor() {
    this.target = new EventTarget();
  }

  /**
   * Publish an event onto the bus
   */
  publish<T>(type: BusEventType, payload: T): void {
    const busEvent: BusEvent<T> = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    const customEvent = new CustomEvent(type, { detail: busEvent });
    this.target.dispatchEvent(customEvent);
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe<T>(type: BusEventType, listener: BusListener<T>): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<BusEvent<T>>;
      listener(customEvent.detail);
    };

    this.target.addEventListener(type, handler);
    return () => {
      this.target.removeEventListener(type, handler);
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(listener: (event: BusEvent) => void): () => void {
    const allTypes: BusEventType[] = [
      'DISRUPTION_DETECTED',
      'AI_OPTIMIZATION_STARTED',
      'CANDIDATE_STREAMED',
      'RECOMMENDATION_GENERATED',
      'REALLOCATION_APPROVED',
      'SLA_UPDATED',
      'AUDIT_LOG_WRITTEN',
      'NOTIFICATION_RECEIVED'
    ];

    const unsubs = allTypes.map(type => this.subscribe(type, listener));
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }
}

// Single instance export for app-wide reactive event pub/sub
export const realtimeBus = new RealtimeBusService();
