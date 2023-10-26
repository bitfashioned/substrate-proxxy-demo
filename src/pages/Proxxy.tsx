import { Stack, Typography } from '@mui/material';
import useApi from '../substrate/hooks/useApi';
import useAccounts from '../substrate/hooks/useAccounts';
import { useCallback, useEffect, useState } from 'react';
import { BN } from '@polkadot/util';
import { web3FromSource } from '@polkadot/extension-dapp';
import FinishPanel, { TxStatus, TxData } from './FinishPanel';
import keyring from '@polkadot/ui-keyring';
import Loading from '../substrate/components/Loading';
import FormatBalance from '../substrate/components/FormatBalance';
import { getExtrinsicData } from '../substrate/utils';

const dest = '6aKotrerQMoBvZtbMsq3FHDV9CwYFQZ3ug8cughNdApjRRwk';
const value = 100000000;

const Proxxy = () => {
    const accounts = useAccounts();
    const { api, proxxy } = useApi();
    const [balances, setBalances] = useState<BN[]>();
    const [nonces, setNonces] = useState<number[]>();
    const [status, setStatus] = useState<TxStatus>();
    const [txdata, setTxData] = useState<TxData>();
    const [error, setError] = useState<string>();
    const [account, setAccount] = useState<string>('');

    const reset = useCallback(() => {
        setError(undefined);
        setTxData(undefined);
        setStatus(undefined);
      }, []);

    useEffect(() => {
        api?.query.system.account
        .multi(accounts?.allAccounts)
        .then((infos) => {
            const b = infos.map((info) => info.data.free.add(info.data.reserved));
            const n = infos.map((info) => info.nonce.toNumber());
            setBalances(b);
            setNonces(n);
            setAccount(accounts?.allAccounts[0]);
        })
        .catch((error) => console.error(error));
    }, [accounts?.allAccounts, api?.query?.system?.account]);

    const submit = useCallback(async () => {
        if (api && proxxy) {
            setError(undefined);
            setStatus('signing');
            try {        
                // 1. Create transaction
                const pair = keyring.getPair(account);
                const { meta: { source } } = pair;
                const tx = api.tx.balances.transferKeepAlive(dest, value);
                const injectedSigner = await web3FromSource(source || '');
                const nonce = nonces?.[0] || 0;
                const options = { signer: injectedSigner.signer, nonce: nonce, era: 0 };

                // 2. Sign transaction
                await tx.signAsync(account, options)
                setStatus('sending');
    
                // 3. Send transaction
                const hash = await api.rpc.author.submitExtrinsic(tx);
                const hashStr = hash.toHex();

                // 4. Confirm transaction
                setStatus('confirming');

                // Get result from indexer
                const data = await getExtrinsicData(hashStr, proxxy);
                setStatus('included');
                setTxData({
                    hash: hashStr,
                    block: data.block_number,
                    timestamp: data.timestamp,
                });
            } catch(err) {
                console.error(err);
                setError((err as string).toString());
                setStatus(undefined);
                setTxData(undefined);
            };
        }
    }, [api, account]);

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
            <Typography variant='h4'>Substrate + Proxxy Demo</Typography>
            <br />
            <Typography variant='h6'>Account</Typography>
            <Stack spacing={2}>
                {accounts?.allAccounts?.map((account, index) => (
                    <Typography key={index}>{account.toString()}</Typography>
                ))}
            </Stack>
            <br />
            <Typography variant='h6'>Balance</Typography>
            {(balances && balances.length >= 1) ? (
                <Stack spacing={2}>
                    {balances?.map((balance, index) => (
                        <Typography key={index}>
                            <FormatBalance value={balance} precision={5} />
                        </Typography>
                    ))}
                </Stack>
            ) :(<Loading size='sm' />)}
            <br />
            {!status ? (
                <button onClick={submit}>Send Payment</button>
            ) : (
                <FinishPanel account={account}
                    error={error}
                    status={status}
                    txdata={txdata}
                    reset={reset}
                />
            )}

        </Stack>
  );
};

export default Proxxy;