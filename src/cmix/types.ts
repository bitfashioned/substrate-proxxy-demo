import type { ReactNode } from "react";

export type WithChildren = {
  children?: ReactNode;
};

type HealthCallback = { Callback: (healthy: boolean) => void };

export type XXDKUtils = {
  NewCmix: (
    ndf: string,
    storageDir: string,
    password: Uint8Array,
    registrationCode: string
  ) => Promise<void>;
  LoadCmix: (
    storageDirectory: string,
    password: Uint8Array,
    cmixParams: Uint8Array
  ) => Promise<CMix>;
  Login: (
    cmixId: number,
    callbacks: any,
    identity: Uint8Array,
    e2eparams: Uint8Array
  ) => E2E;
  StoreReceptionIdentity: (
    key: string,
    identity: Uint8Array,
    cmixId: number
  ) => void;
  LoadReceptionIdentity: (key: string, cmixId: number) => Uint8Array;
  RequestRestLike: (
    e2eId: number,
    recipient: Uint8Array,
    message: Uint8Array,
    params: Uint8Array
  ) => Promise<Uint8Array>;
  GetDefaultCMixParams: () => Uint8Array;
  GetDefaultE2EParams: () => Uint8Array;
  GetDefaultSingleUseParams: () => Uint8Array;
  Uint8ArrayToBase64: (bytes: Uint8Array) => string;
  Base64ToUint8Array: (base64: string) => Uint8Array;
  GetVersion: () => string;
  GetClientVersion: () => string;
  GetOrInitPassword: (password: string) => Promise<Uint8Array>;
  GetWasmSemanticVersion: () => Uint8Array;
};

export type CMix = {
  AddHealthCallback: (callback: HealthCallback) => number;
  GetID: () => number;
  IsReady: (threshold: number) => Uint8Array;
  ReadyToSend: () => boolean;
  StartNetworkFollower: (timeoutMilliseconds: number) => void;
  StopNetworkFollower: () => void;
  WaitForNetwork: (timeoutMilliseconds: number) => Promise<void>;
  SetTrackNetworkPeriod: (periodMs: number) => void;
  MakeReceptionIdentity(): Promise<Uint8Array>;
};

export type E2E = {
  GetID: () => number;
};

export type CMixParams = {
  Network: {
    TrackNetworkPeriod: number;
    MaxCheckedRounds: number;
    RegNodesBufferLen: number;
    NetworkHealthTimeout: number;
    ParallelNodeRegistrations: number;
    KnownRoundsThreshold: number;
    FastPolling: boolean;
    VerboseRoundTracking: boolean;
    RealtimeOnly: boolean;
    ReplayRequests: boolean;
    EnableImmediateSending: boolean;
    MaxParallelIdentityTracks: number;
    Rounds: {
      MaxHistoricalRounds: number;
      HistoricalRoundsPeriod: number;
      HistoricalRoundsBufferLen: number;
      MaxHistoricalRoundsRetries: number;
    };
    Pickup: {
      NumMessageRetrievalWorkers: number;
      LookupRoundsBufferLen: number;
      MaxHistoricalRoundsRetries: number;
      UncheckRoundPeriod: number;
      ForceMessagePickupRetry: boolean;
      SendTimeout: number;
      RealtimeOnly: boolean;
      ForceHistoricalRounds: boolean;
    };
    Message: {
      MessageReceptionBuffLen: number;
      MessageReceptionWorkerPoolSize: number;
      MaxChecksInProcessMessage: number;
      InProcessMessageWait: number;
      RealtimeOnly: boolean;
    };
    Historical: {
      MaxHistoricalRounds: number;
      HistoricalRoundsPeriod: number;
      HistoricalRoundsBufferLen: number;
      MaxHistoricalRoundsRetries: number;
    };
  };
  CMIX: {
    RoundTries: number;
    Timeout: number;
    RetryDelay: number;
    SendTimeout: number;
    DebugTag: string;
    BlacklistedNodes: Record<string, boolean>;
    Critical: boolean;
  };
};
