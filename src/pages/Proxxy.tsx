import { Stack, Typography } from '@mui/material';
import useApi from '../substrate/hooks/useApi';
import useAccounts from '../substrate/hooks/useAccounts';
import { useEffect, useState } from 'react';
import { BN, BN_BILLION } from '@polkadot/util';

const Proxxy = () => {
    const accounts = useAccounts();
    const { api } = useApi();
    const [balances, setBalances] = useState<BN[]>();

    useEffect(() => {
        api?.query.system.account
        .multi(accounts?.allAccounts)
        .then((infos) => {
            const b = infos.map((info) => info.data.free.add(info.data.reserved));
            setBalances(b);
        })
        .catch((error) => console.error(error));
    }, [accounts?.allAccounts, api?.query?.system?.account]);

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