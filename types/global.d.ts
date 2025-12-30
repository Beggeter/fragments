declare global {
    interface Window {
        show?: () => Promise<void>;
        initCdTma?: (options: { id: string }) => Promise<() => Promise<void>>;
    }
}

export { };