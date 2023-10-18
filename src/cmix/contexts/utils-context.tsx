import type { CMix, E2E, WithChildren } from '../types';
import React, { FC, useState } from 'react';
import Loading from '../components/LoadingView';
import WebAssemblyRunner from '../components/WebAssemblyRunner';
import { CMIX_INITIALIZATION_KEY } from '../constants';

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
    e2eparams: Uint8Array,
  ) => E2E;
  StoreReceptionIdentity: (
    key: string,
    identity: Uint8Array,
    cmixId: number,
  ) => void;
  LoadReceptionIdentity: (
    key: string,
    cmixId: number,
  ) => Uint8Array;
  RequestRestLike: (
    e2eId: number,
    recipient: Uint8Array,
    message: Uint8Array,
    params: Uint8Array,
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
}

const initialUtils = {
  shouldRenderImportCodeNameScreen: false,
} as unknown as XXDKUtils;

export type XXDKContext = {
  utils: XXDKUtils;
  setUtils: (utils: XXDKUtils) => void;
  utilsLoaded: boolean;
  setUtilsLoaded: (loaded: boolean) => void;
}

export const UtilsContext = React.createContext<XXDKContext>({
  utils: initialUtils,
  utilsLoaded: false,
  shouldRenderImportCodeNameScreen: false,
} as unknown as XXDKContext);

UtilsContext.displayName = 'UtilsContext';

export type IdentityJSON = {
  PubKey: string;
  Codename: string;
  Color: string;
  Extension: string;
  CodesetVersion: number;
}

// Clear the storage in case a half assed registration was made
if (typeof window !== 'undefined' && localStorage.getItem(CMIX_INITIALIZATION_KEY) === 'false') {
  localStorage.clear();
}

export const UtilsProvider: FC<WithChildren> = ({ children }) => {
  const [utils, setUtils] = useState<XXDKUtils>();
  const [utilsLoaded, setUtilsLoaded] = useState<boolean>(false);

  return (
    <UtilsContext.Provider
      value={{
        utils: utils as XXDKUtils,
        setUtils,
        utilsLoaded,
        setUtilsLoaded,
      }}
    >
      <WebAssemblyRunner>
        {utils ? children : <Loading message={'Loading XXDK...'} />}
      </WebAssemblyRunner>
    </UtilsContext.Provider>
  );
};

export const useUtils = () => {
  const context = React.useContext(UtilsContext);

  if (context === undefined) {
    throw new Error('useUtils must be used within a UtilsProvider');
  }

  return context;
};
