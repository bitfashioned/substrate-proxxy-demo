import type { WithChildren } from '../../types';
import { FC, useEffect, useCallback, useMemo, useRef, useState, ReactNode } from 'react';
import "@polkadot/api-augment"
import { ApiPromise } from '@polkadot/api';
import { keyring } from '@polkadot/ui-keyring';
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { objectSpread } from '@polkadot/util';
import { TypeRegistry } from '@polkadot/types/create';
import { Box, Typography } from '@mui/material';

import ApiContext, { ApiContextType } from './ApiContext';
import Error from './Error';
import Loading from './Loading';
import { ProxxyProvider } from '../../proxxy/provider';
import { ProxxyClient } from '../../proxxy/client';

interface InjectedAccountExt {
  address: string;
  meta: {
    name: string;
    source: string;
    whenCreated: number;
  };
}

function isKeyringLoaded () {
  try {
    return !!keyring.keyring;
  } catch {
    return false;
  }
}

async function getInjectedAccounts (injectedPromise: Promise<InjectedExtension[]>): Promise<InjectedAccountExt[]> {
  try {
    await injectedPromise;

    const accounts = await web3Accounts();

    return accounts.map(({ address, meta }, whenCreated): InjectedAccountExt => ({
      address,
      meta: objectSpread({}, meta, {
        name: `${meta.name || 'unknown'} (${meta.source === 'polkadot-js' ? 'extension' : meta.source})`,
        whenCreated
      })
    }));
  } catch (error) {
    console.error('web3Accounts', error);

    return [];
  }
}

async function load(api: ApiPromise, injectedPromise: Promise<InjectedExtension[]>): Promise<void> {
  const injectedAccounts = await getInjectedAccounts(injectedPromise);
  console.log(`Proxxy: got accounts: ${injectedAccounts.map(({ address }) => address).join(', ')}`);
  const accounts = injectedAccounts.map(({ address, meta }) => {
    return {
      address,
      meta: {
        genesisHash: api.genesisHash.toHex(),
        name: meta.name,
        source: meta.source,
        whenCreated: meta.whenCreated,
      }
    }
  });
  if (!isKeyringLoaded()) {
    console.log(`Proxxy: loading keyring`);
    keyring.loadAll({
      genesisHash: api.genesisHash,
      ss58Format: api.registry.chainSS58
    }, accounts);
  }
}

const registry = new TypeRegistry();

type Props = {
  children?: ReactNode;
  network?: string;
  e2eId?: number;
};

const ApiProvider: FC<Props> = ({ children, e2eId, network }) => {
  const [error, setApiError] = useState<null | string>(null);
  const [api, setApi] = useState<ApiPromise>();
  const [connected, setConnected] = useState(false);
  const [ready, setIsReady] = useState(false);
  const [proxxy, setProxxy] = useState<ProxxyClient>();

  const onError = useCallback(
    (err: unknown): void => {
      console.error(err);

      setApiError((err as Error).message);
    },
    [setApiError]
  );

  useEffect(() => {
    if (!api && e2eId !== undefined && network) {
      console.log("Proxxy: Creating Provider");
      const provider = new ProxxyProvider(e2eId, network);
      // Connect to the provider
      provider.connect().then(() => {
        // Create the API
        setProxxy(provider.proxxy);
        console.log("Proxxy: Creating API");
        setApi(
          new ApiPromise({
            provider,
            registry
          })
        );
      })
    }
  }, [api, e2eId]);

  useEffect(() => {
    if (api) {
      api.on('disconnected', () => setConnected(false));
      api.on('connected', () => setConnected(true));
      api.on('error', onError);
      api.on('ready', () => {
        console.log("Proxxy: API ready, enabling web3");
        const injectedPromise = web3Enable('substrate proxxy demo');

        injectedPromise
          .catch(console.error);

        load(api, injectedPromise)
          .catch(onError);

        setIsReady(true);
      });
    }
  }, [api, onError]);

  const context = useMemo<ApiContextType>(
    () => ({
      api,
      connected,
      ready,
      error,
      network: network || "/xx/mainnet",
      proxxy,
    }),
    [api, connected, error, ready, proxxy]
  );

  if (error) {
    return (
      <Box sx={{ p: 5, py: 10, textAlign: 'center' }}>
        <Error
          variant='body1'
          sx={{ fontSize: 24, pb: 5 }}
          message='Service currently unavailable. Please check your internet connectivity.'
        />
      </Box>
    );
  }

  if (!ready) {
    return (
      <Box sx={{ p: 5, py: 20 }}>
        <Loading size='md' />
        <Typography variant='body1' sx={{ textAlign: 'center', marginTop: '1em' }}>
          Connecting to xx network, please wait...
        </Typography>
      </Box>
    );
  }

  return <ApiContext.Provider value={context}>{children}</ApiContext.Provider>;
};

export default ApiProvider;
