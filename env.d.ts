/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string

  readonly VITE_PUBSUBSERVICE_LOG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
