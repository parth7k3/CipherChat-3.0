/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MATRIX_HOMESERVER_URL?: string;
  readonly VITE_MATRIX_SERVER_NAME?: string;
  readonly VITE_TURN_SERVER_URL?: string;
  readonly VITE_STUN_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
