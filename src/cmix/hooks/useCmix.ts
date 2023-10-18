import type { CMix, E2E, CMixParams } from "../types";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUtils } from "../contexts/utils-context";
import { encoder, decoder } from "../utils";
import {
  CMIX_INITIALIZATION_KEY,
  FOLLOWER_TIMEOUT_PERIOD,
  STATE_PATH,
} from "../constants";
import { ndf } from "../ndf";
import useTrackNetworkPeriod from "./useNetworkTrackPeriod";
import useLocalStorage from "./useLocalStorage";

export enum NetworkStatus {
  UNINITIALIZED = "uninitialized",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  FAILED = "failed",
}

const useCmix = () => {
  const [cmixPreviouslyInitialized, setCmixPreviouslyInitialized] =
    useLocalStorage(CMIX_INITIALIZATION_KEY, false);
  const [status, setStatus] = useState<NetworkStatus>(
    NetworkStatus.UNINITIALIZED
  );
  const [cmix, setCmix] = useState<CMix | undefined>();
  const [e2e, setE2e] = useState<E2E | undefined>();
  const { utils } = useUtils();
  const cmixId = useMemo(() => cmix?.GetID(), [cmix]);
  const e2eId = useMemo(() => e2e?.GetID(), [e2e]);
  const { trackingMs } = useTrackNetworkPeriod();

  const encodedCmixParams = useMemo(() => {
    const params = JSON.parse(
      decoder.decode(utils.GetDefaultCMixParams())
    ) as CMixParams;
    params.Network.EnableImmediateSending = true;
    return encoder.encode(JSON.stringify(params));
  }, [utils]);

  const initializeCmix = useCallback(
    async (password: Uint8Array) => {
      await utils.NewCmix(ndf, STATE_PATH, password, "");
    },
    [utils]
  );

  const loadCmix = useCallback(
    async (password: Uint8Array) => {
      const loadedCmix = await utils.LoadCmix(
        STATE_PATH,
        password,
        encodedCmixParams
      );
      // Create/Load reception identity for proxxy
      const cmixId = loadedCmix.GetID();
      let identity: Uint8Array;
      try {
        identity = utils.LoadReceptionIdentity(
          "proxxyReceptionIdentity",
          cmixId
        );
        console.log("Reception identity loaded");
      } catch {
        console.log("Creating new reception identity");
        // Create new identity
        identity = await loadedCmix.MakeReceptionIdentity();
        // Store identity
        utils.StoreReceptionIdentity(
          "proxxyReceptionIdentity",
          identity,
          cmixId
        );
      }
      // Create E2E client
      setCmix(loadedCmix);
      console.log("Loading E2E client");
      const e2eParams = utils.GetDefaultE2EParams();
      const e2e = utils.Login(
        cmixId,
        { Request: () => {}, Confirm: () => {}, Reset: () => {} },
        identity,
        e2eParams
      );
      setE2e(e2e);
    },
    [encodedCmixParams, utils]
  );

  const connect = useCallback(async () => {
    if (!cmix) {
      throw Error("Cmix required");
    }

    setStatus(NetworkStatus.CONNECTING);
    try {
      cmix.StartNetworkFollower(FOLLOWER_TIMEOUT_PERIOD);
    } catch (error) {
      console.error("Error while StartNetworkFollower:", error);
      setStatus(NetworkStatus.FAILED);
    }

    try {
      await cmix.WaitForNetwork(10 * 60 * 1000);
      setStatus(NetworkStatus.CONNECTED);
    } catch (e) {
      console.error("Timed out. Network is not healthy.");
      setStatus(NetworkStatus.FAILED);
    }
  }, [cmix]);

  const disconnect = useCallback(() => {
    cmix?.StopNetworkFollower();
    setStatus(NetworkStatus.DISCONNECTED);
    setCmix(undefined);
  }, [cmix]);

  useEffect(() => {
    if (cmix) {
      cmix.AddHealthCallback({
        Callback: (isHealthy: boolean) => {
          if (isHealthy) {
            setStatus(NetworkStatus.CONNECTED);
          } else {
            setStatus(NetworkStatus.DISCONNECTED);
          }
        },
      });
    }
  }, [cmix]);

  useEffect(() => {
    if (cmix) {
      connect();
    }
  }, [connect, cmix]);

  useEffect(() => {
    if (cmix && status === NetworkStatus.CONNECTED) {
      cmix.SetTrackNetworkPeriod(trackingMs);
    }
  }, [cmix, status, trackingMs]);

  const initialize = useCallback(
    async (encryptedPass: Uint8Array) => {
      try {
        if (!cmixPreviouslyInitialized) {
          await initializeCmix(encryptedPass);
          setCmixPreviouslyInitialized(true);
        }
        return await loadCmix(encryptedPass);
      } catch (e) {
        setStatus(NetworkStatus.FAILED);
        throw e;
      }
    },
    [cmixPreviouslyInitialized, initializeCmix, loadCmix]
  );

  return {
    connect,
    cmix,
    disconnect,
    id: cmixId,
    e2eId,
    status,
    initialize,
  };
};

export default useCmix;
