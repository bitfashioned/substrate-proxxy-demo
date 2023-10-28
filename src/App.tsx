import ApiProvider from './substrate/components/ApiProvider';
import Proxxy from './pages/Proxxy';
import './App.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SelectNetwork } from './pages/SelectNetwork';
import { initCmix } from './cmix';
import { encoder } from './cmix/utils';
import { Stack, Typography } from '@mui/material';

const pw = encoder.encode('12345678901234567890');

function App() {
  const calledInit = useRef(false);
  const [e2eId, setE2eId] = useState<number>();
  const [network, setNetwork] = useState<string>();

  // Select network
  const networkSetter = useCallback((network: string) => {
    setNetwork(network);
  }, [setNetwork]);

  // Cmix Initialization
  useEffect(() => {
    async function initOnce() {
        calledInit.current = true;
        // Init proxxy
        console.log("Proxxy: Initializing CMIX...");
        const id = await initCmix(pw);
        setE2eId(id);
        console.log("Proxxy: CMIX Initialized!");
    }
    if (!calledInit.current) {
      initOnce();
    }
  }, [setE2eId]);

  // Component
  return (
    <>
    {network ? (
      <ApiProvider
        network={network}
        e2eId={e2eId}
      >
        <Proxxy/>
      </ApiProvider>
    ) : (
      <Stack alignSelf={"center"}>
        <Typography variant='h3'>Substrate + Proxxy Demo</Typography>
        <br/>
        <SelectNetwork networkSetter={networkSetter}/>
      </Stack>
    )}
    </>
  );
}

export default App;