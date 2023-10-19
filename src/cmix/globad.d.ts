import { XXDKUtils } from "./types";

type Logger = {
  StopLogging: () => void;
  GetFile: () => Promise<string>;
  Threshold: () => number;
  MaxSize: () => number;
  Size: () => Promise<number>;
  Worker: () => Worker;
};

declare global {
  interface Window {
    onWasmInitialized: () => void;
    Crash: () => void;
    GetLogger: () => Logger;
    logger?: Logger;
    getCrashedLogFile: () => Promise<string>;
    utils?: XXDKUtils;
  }
}
