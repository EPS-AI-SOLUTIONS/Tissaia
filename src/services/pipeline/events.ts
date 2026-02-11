// src/services/pipeline/events.ts
/**
 * Pipeline Event Emitter
 * ======================
 * Typed event emitter for pipeline stage/progress events.
 * Inspired by mitt but built-in for zero dependencies.
 */
import type { PipelineEvents } from './types';

type EventMap = PipelineEvents;
type EventKey = keyof EventMap;
type Handler<T> = (event: T) => void;

export class PipelineEventEmitter {
  private handlers: Map<EventKey, Set<Handler<unknown>>> = new Map();
  private wildcardHandlers: Set<Handler<{ type: EventKey; event: unknown }>> = new Set();

  on<K extends EventKey>(type: K, handler: Handler<EventMap[K]>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)?.add(handler as Handler<unknown>);

    // Return unsubscribe function
    return () => this.off(type, handler);
  }

  off<K extends EventKey>(type: K, handler: Handler<EventMap[K]>): void {
    this.handlers.get(type)?.delete(handler as Handler<unknown>);
  }

  emit<K extends EventKey>(type: K, event: EventMap[K]): void {
    // Notify specific handlers
    this.handlers.get(type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error(`[PipelineEvents] Error in handler for "${type}":`, err);
      }
    });

    // Notify wildcard handlers
    this.wildcardHandlers.forEach((handler) => {
      try {
        handler({ type, event });
      } catch (err) {
        console.error('[PipelineEvents] Error in wildcard handler:', err);
      }
    });
  }

  /** Subscribe to all events */
  onAny(handler: Handler<{ type: EventKey; event: unknown }>): () => void {
    this.wildcardHandlers.add(handler);
    return () => this.wildcardHandlers.delete(handler);
  }

  /** Remove all listeners */
  clear(): void {
    this.handlers.clear();
    this.wildcardHandlers.clear();
  }
}
