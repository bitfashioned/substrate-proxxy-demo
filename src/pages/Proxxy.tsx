import { Stack, Typography } from '@mui/material';
import useApi from '../substrate/hooks/useApi';
import useAccounts from '../substrate/hooks/useAccounts';
import { useEffect, useRef, useState } from 'react';
import { BN, BN_BILLION } from '@polkadot/util';
import { useProxxy } from '../cmix/contexts/proxxy-context';
import { encoder } from '../cmix/utils';
import { relayContact } from '../assets/relay';

// Use proxxy by default
const proxxyActive = process.env.REACT_APP_PROXXY_ACTIVE || true;
const relay = encoder.encode(relayContact);

const Proxxy = () => {
    const accounts = useAccounts();
    const { api } = useApi();
    const [balances, setBalances] = useState<BN[]>();

    // Connect to Proxxy
    const calledInit = useRef(false);
    const [ loading, setLoading ] = useState(false);
    const [ networks, setNetworks ] = useState<string[]>();

    const { ready, connect, request } = useProxxy();

    useEffect(() => {
        api?.query.system.account
        .multi(accounts?.allAccounts)
        .then((infos) => {
            const b = infos.map((info) => info.data.free.add(info.data.reserved));
            setBalances(b);
        })
        .catch((error) => console.error(error));
    }, [accounts?.allAccounts, api?.query?.system?.account]);
    
    // Connect to proxxy once, when ready
    useEffect(() => {
        async function initProxxy() {
            calledInit.current = true;
            // Connect to proxxy
            console.log('Proxxy: Connecting...');
            setLoading(true);
            const networks = await connect(relay);
            if (networks) {
                console.log('Proxxy: Connected!');
                setNetworks(networks);
            } else {
                console.log('Proxxy: Failed to connect');
            }
        }
        if (!calledInit.current && ready) {
            initProxxy();
        }
    }, [connect, setNetworks, setLoading, ready]);

    const submit = async () => {
        window.alert('Payment!')

    };

    return (
        <Stack
            className='App'
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
            }}
        >
            <Typography variant='h4'>Substrate + Proxxy Test</Typography>
            <br />
            <Typography variant='h6'>Account</Typography>
            <Stack spacing={2}>
                {accounts?.allAccounts?.map((account, index) => (
                    <Typography key={index}>{account.toString()}</Typography>
                ))}
            </Stack>
            <br />
            <Typography variant='h6'>Balance</Typography>
            <Stack spacing={2}>
                {balances?.map((balance, index) => (
                    <Typography key={index}>{balance.div(BN_BILLION).toString()} xx</Typography>
                ))}
            </Stack>
            <br />
            <button onClick={submit}>Send Payment</button>
        </Stack>
  );
};

export default Proxxy;