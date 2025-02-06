/// <reference types="@types/google.maps" />

declare module '@googlemaps/three' {
  export const ThreeJSOverlayView: any;
}

declare global {
  interface Window {
    initMap: () => void;
    google: typeof google;
  }
}

export {};
