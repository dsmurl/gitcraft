// minimal env typing
declare namespace NodeJS {
  interface ProcessEnv {
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    SESSION_SECRET?: string;
    API_PORT?: string;
  }
}
