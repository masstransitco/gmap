declare global {
  interface Window {
    initMap: () => Promise<void>;
    google: typeof google;
  }
}

export {};
