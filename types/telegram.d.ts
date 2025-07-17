declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            auth_date?: number;
            hash?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        openInvoice?: (...args: any[]) => void;
        // Viewport properties
        viewportHeight: number;
        viewportStableHeight: number;
        isExpanded: boolean;
        // Theme and appearance
        setHeaderColor?: (color: string) => void;
        // Closing confirmation
        disableClosingConfirmation?: () => void;
        enableClosingConfirmation?: () => void;
        // Events
        onEvent?: (eventType: string, callback: () => void) => void;
        offEvent?: (eventType: string, callback: () => void) => void;
        // Platform info
        platform?: string;
        version?: string;
        // Fullscreen mode (immersive)
        isFullscreen?: boolean;
        requestFullscreen?: () => void;
        exitFullscreen?: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
        };
      };
    };
  }
}

export {};
