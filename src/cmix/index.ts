import {
  CMIX_INITIALIZATION_KEY,
  FOLLOWER_TIMEOUT_PERIOD,
  STATE_PATH,
  XXDK_PATH,
} from "./constants";
import { ndf } from "./ndf";
import { encoder, decoder } from "./utils";
import { CMixParams } from "./types";

const isReady = new Promise<void>((resolve) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.onWasmInitialized = resolve;
});

export const initCmix = async (password: Uint8Array): Promise<number> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const go = new (window as any).Go();
  go.argv = [
    "--logLevel=1",
    "--fileLogLevel=1",
    "--workerScriptURL=integrations/assets/logFileWorker.js",
  ];

  // 1. INIT XXDK
  console.log("Proxxy: Initializing XXDK");
  const result = await WebAssembly?.instantiateStreaming(
    fetch(XXDK_PATH),
    go.importObject
  );
  console.log("Proxxy: WASM instantiated");
  go?.run(result?.instance);
  console.log("Proxxy: go.run called");
  await isReady;
  console.log("Proxxy: after isReady");
  const {
    Base64ToUint8Array,
    Uint8ArrayToBase64,
    GetClientVersion,
    GetDefaultCMixParams,
    GetDefaultE2EParams,
    GetDefaultSingleUseParams,
    GetOrInitPassword,
    GetVersion,
    GetWasmSemanticVersion,
    LoadCmix,
    Login,
    StoreReceptionIdentity,
    LoadReceptionIdentity,
    RequestRestLike,
    NewCmix,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = (window as any) || {};

  window.utils = {
    Base64ToUint8Array,
    Uint8ArrayToBase64,
    GetClientVersion,
    GetDefaultCMixParams,
    GetDefaultE2EParams,
    GetDefaultSingleUseParams,
    GetOrInitPassword,
    GetVersion,
    GetWasmSemanticVersion,
    LoadCmix,
    Login,
    StoreReceptionIdentity,
    LoadReceptionIdentity,
    RequestRestLike,
    NewCmix,
  };

  const { GetLogger } = window;
  const logger = GetLogger();

  // Get the actual Worker object from the log file object
  const w = logger.Worker();

  window.getCrashedLogFile = () => {
    return new Promise((resolve) => {
      w.addEventListener("message", (ev) => {
        resolve(atob(JSON.parse(ev.data).data));
      });
      w.postMessage(JSON.stringify({ tag: "GetFileExt" }));
    });
  };

  window.logger = logger;

  console.log("Proxxy: Logger setup");

  // 2. INIT CMIX

  // Check if created before
  console.log("Proxxy: Checking if cmix exists");
  let hasCmix = false;
  try {
    const value = window.localStorage.getItem(CMIX_INITIALIZATION_KEY);

    if (value) {
      hasCmix = JSON.parse(value) as boolean;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }

  // Create cmix
  if (!hasCmix) {
    console.log("Proxxy: Creating CMIX");
    await window.utils?.NewCmix(ndf, STATE_PATH, password, "");
    // Set as created
    window.localStorage.setItem(CMIX_INITIALIZATION_KEY, JSON.stringify(true));
  }

  // Load cmix
  console.log("Proxxy: loading CMIX");
  const params = JSON.parse(
    decoder.decode(window.utils?.GetDefaultCMixParams())
  ) as CMixParams;
  params.Network.EnableImmediateSending = true;
  const encodedCmixParams = encoder.encode(JSON.stringify(params));
  const loadedCmix = await window.utils?.LoadCmix(
    STATE_PATH,
    password,
    encodedCmixParams
  );
  console.log("Proxxy: CMIX loaded");

  // Create/Load reception identity for proxxy
  const cmixId = loadedCmix.GetID();
  let identity: Uint8Array;
  try {
    identity = window.utils?.LoadReceptionIdentity(
      "proxxyReceptionIdentity",
      cmixId
    );
    console.log("Proxxy: Reception identity loaded");
  } catch {
    console.log("Proxxy: Creating new reception identity");
    // Create new identity
    identity = await loadedCmix.MakeReceptionIdentity();
    // Store identity
    window.utils?.StoreReceptionIdentity(
      "proxxyReceptionIdentity",
      identity,
      cmixId
    );
  }

  // Create E2E client
  console.log("Proxxy: Loading E2E client");
  const e2eParams = window.utils?.GetDefaultE2EParams();
  const e2e = window.utils?.Login(
    cmixId,
    { Request: () => {}, Confirm: () => {}, Reset: () => {} },
    identity,
    e2eParams
  );
  const e2eId = e2e?.GetID();

  // 3. Connect to cmix
  loadedCmix.StartNetworkFollower(FOLLOWER_TIMEOUT_PERIOD);
  try {
    await loadedCmix.WaitForNetwork(10 * 60 * 1000);
    console.log("Proxxy: CMIX network is healthy");
  } catch (e) {
    console.error("Timed out. Network is not healthy.");
    throw e;
  }

  // TODO: return more things
  // Improve all of this into a class with event emitters?
  // Use polkadot-js/wasm bridge to wrap all the xxdk stuff?
  return e2eId;
};
