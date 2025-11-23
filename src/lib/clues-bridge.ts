/**
 * CLUES Land Bridge - Integration with Parent CLUES Quantum App
 *
 * This module enables:
 * 1. Standalone operation when running independently
 * 2. Nested operation inside CLUES Quantum Master App
 * 3. Data synchronization between apps
 * 4. Shared authentication/context
 */

export interface CluesBridgeConfig {
  parentUrl?: string;
  apiKey?: string;
  syncEnabled?: boolean;
}

export interface PropertySyncPayload {
  propertyId: string;
  address: string;
  data: Record<string, unknown>;
  source: 'dashboard' | 'parent';
  timestamp: string;
}

export interface CluesParentMessage {
  type: 'CLUES_INIT' | 'CLUES_SYNC' | 'CLUES_NAVIGATE' | 'CLUES_THEME' | 'CLUES_AUTH';
  payload: unknown;
}

class CluesBridge {
  private config: CluesBridgeConfig = {};
  private isNested = false;
  private parentOrigin: string | null = null;
  private messageQueue: CluesParentMessage[] = [];
  private ready = false;

  constructor() {
    this.detectEnvironment();
    this.setupMessageListener();
  }

  /**
   * Detect if running inside parent app (iframe) or standalone
   */
  private detectEnvironment(): void {
    try {
      this.isNested = window.self !== window.top;
      if (this.isNested) {
        console.log('🔗 CLUES Bridge: Running in nested mode (inside parent app)');
      } else {
        console.log('🏠 CLUES Bridge: Running in standalone mode');
      }
    } catch {
      // Cross-origin iframe access blocked - definitely nested
      this.isNested = true;
      console.log('🔗 CLUES Bridge: Running in nested mode (cross-origin)');
    }
  }

  /**
   * Listen for messages from parent app
   */
  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      // Validate origin if configured
      if (this.parentOrigin && event.origin !== this.parentOrigin) {
        return;
      }

      const message = event.data as CluesParentMessage;
      if (!message?.type?.startsWith('CLUES_')) {
        return;
      }

      console.log('📨 CLUES Bridge: Received message', message.type);
      this.handleParentMessage(message, event.origin);
    });
  }

  /**
   * Handle messages from parent app
   */
  private handleParentMessage(message: CluesParentMessage, origin: string): void {
    this.parentOrigin = origin;

    switch (message.type) {
      case 'CLUES_INIT':
        this.handleInit(message.payload as CluesBridgeConfig);
        break;

      case 'CLUES_SYNC':
        this.handleSync(message.payload as PropertySyncPayload);
        break;

      case 'CLUES_NAVIGATE':
        this.handleNavigate(message.payload as { path: string });
        break;

      case 'CLUES_THEME':
        this.handleTheme(message.payload as { theme: string });
        break;

      case 'CLUES_AUTH':
        this.handleAuth(message.payload as { token: string; user: unknown });
        break;
    }
  }

  /**
   * Initialize connection with parent app
   */
  private handleInit(config: CluesBridgeConfig): void {
    this.config = config;
    this.ready = true;

    // Process queued messages
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) this.sendToParent(msg.type, msg.payload);
    }

    // Notify parent we're ready
    this.sendToParent('CLUES_READY', { version: '1.0.0' });

    console.log('✅ CLUES Bridge: Initialized', config);
  }

  /**
   * Handle property data sync from parent
   */
  private handleSync(payload: PropertySyncPayload): void {
    console.log('🔄 CLUES Bridge: Syncing property', payload.propertyId);

    // Emit custom event for app to handle
    window.dispatchEvent(
      new CustomEvent('clues:property-sync', { detail: payload })
    );
  }

  /**
   * Handle navigation request from parent
   */
  private handleNavigate(payload: { path: string }): void {
    console.log('🧭 CLUES Bridge: Navigate to', payload.path);

    // Use React Router if available
    window.dispatchEvent(
      new CustomEvent('clues:navigate', { detail: payload })
    );
  }

  /**
   * Handle theme change from parent
   */
  private handleTheme(payload: { theme: string }): void {
    console.log('🎨 CLUES Bridge: Theme change', payload.theme);
    document.documentElement.setAttribute('data-theme', payload.theme);
  }

  /**
   * Handle auth token from parent
   */
  private handleAuth(payload: { token: string; user: unknown }): void {
    console.log('🔐 CLUES Bridge: Auth received');
    localStorage.setItem('clues_token', payload.token);

    window.dispatchEvent(
      new CustomEvent('clues:auth', { detail: payload })
    );
  }

  /**
   * Send message to parent app
   */
  sendToParent(type: string, payload: unknown): void {
    if (!this.isNested) {
      console.log('⚠️ CLUES Bridge: Not nested, skipping parent message');
      return;
    }

    if (!this.ready && type !== 'CLUES_READY') {
      this.messageQueue.push({ type, payload } as CluesParentMessage);
      return;
    }

    const message = { type, payload, source: 'clues-property-dashboard' };

    if (this.parentOrigin) {
      window.parent.postMessage(message, this.parentOrigin);
    } else {
      window.parent.postMessage(message, '*');
    }

    console.log('📤 CLUES Bridge: Sent to parent', type);
  }

  /**
   * Sync property data to parent app
   */
  syncProperty(propertyId: string, data: Record<string, unknown>): void {
    const payload: PropertySyncPayload = {
      propertyId,
      address: data.address as string || '',
      data,
      source: 'dashboard',
      timestamp: new Date().toISOString(),
    };

    this.sendToParent('CLUES_PROPERTY_UPDATE', payload);
  }

  /**
   * Request navigation in parent app
   */
  navigateParent(path: string): void {
    this.sendToParent('CLUES_NAVIGATE_PARENT', { path });
  }

  /**
   * Open property in parent app's holographic sphere
   */
  openInHolosphere(propertyId: string): void {
    this.sendToParent('CLUES_OPEN_HOLOSPHERE', { propertyId });
  }

  /**
   * Check if running nested
   */
  isNestedMode(): boolean {
    return this.isNested;
  }

  /**
   * Check if bridge is ready
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Get current config
   */
  getConfig(): CluesBridgeConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const cluesBridge = new CluesBridge();

// React hook for bridge
export function useCluesBridge() {
  return {
    bridge: cluesBridge,
    isNested: cluesBridge.isNestedMode(),
    syncProperty: cluesBridge.syncProperty.bind(cluesBridge),
    navigateParent: cluesBridge.navigateParent.bind(cluesBridge),
    openInHolosphere: cluesBridge.openInHolosphere.bind(cluesBridge),
  };
}

export default cluesBridge;
