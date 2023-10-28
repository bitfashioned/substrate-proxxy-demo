import { Button, Stack, TextField, Typography } from '@mui/material';
import useApi from '../substrate/hooks/useApi';
import useAccounts from '../substrate/hooks/useAccounts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BN } from '@polkadot/util';
import { web3FromSource } from '@polkadot/extension-dapp';
import FinishPanel, { TxStatus, TxData } from './FinishPanel';
import keyring from '@polkadot/ui-keyring';
import Loading from '../substrate/components/Loading';
import FormatBalance from '../substrate/components/FormatBalance';
import { getExtrinsicData } from '../substrate/utils';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex, BN_ZERO, BN_TEN } from '@polkadot/util';

const isValidAddress = (address: string, ss58: number): boolean => {
    try {
        encodeAddress(
        isHex(address)
            ? hexToU8a(address)
            : decodeAddress(address, false, ss58), ss58
        );

        return true;
    } catch (error) {
        return false;
    }
};

const bnToStringDecimal = (bn: BN, decimalsPoints: number) => {
    const converted = bn.toString();
    const regex = `[0-9]{1,${decimalsPoints}}$`;
    const matched = converted.match(new RegExp(regex))?.[0];
    const zeropad = Array(decimalsPoints + 1).join('0');
    const decimals = `${zeropad}${matched}`.slice(-decimalsPoints);
    const lengthDiff = converted.length - (matched?.length ?? 0);
    const integers = converted.slice(0, lengthDiff) || '0';
    const d = decimals?.replace(new RegExp(`0{1,${decimalsPoints}}$`), '');
    return `${integers}${d ? '.' : ''}${d}`;
};

const Proxxy = () => {
    const accounts = useAccounts();
    const { api, network, proxxy } = useApi();
    const [balances, setBalances] = useState<BN[]>();
    const [nonces, setNonces] = useState<number[]>();
    const [status, setStatus] = useState<TxStatus>();
    const [txdata, setTxData] = useState<TxData>();
    const [error, setError] = useState<string>();
    const [account, setAccount] = useState<string>('');
    const [dest, setDest] = useState('');
    const [amount, setAmount] = useState<BN>();
    const [amountStr, setAmountStr] = useState<string>('');
    const [zeropad, setZeropad] = useState(0);
    const [chainDecimals, setChainDecimals] = useState<number>(9);
    const [inputErr, setInputErr] = useState(false);

    const handleDestChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const addr = event.target.value;
        const ss58 = api?.registry.chainSS58 === undefined ? 42 : api?.registry.chainSS58;
        if (isValidAddress(addr, ss58)) {
            setDest(event.target.value);
            setInputErr(false);
        } else {
            setDest(event.target.value);
            setInputErr(true);
        }
    }, [setDest, api]);

    const handleAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const decimalPoints = event.target.value.split('.')[1]?.length ?? 0;
        const parsed = event.target.value.replace(/\D/g, '');
        const zeroes = event.target.value.split('.')[1]?.match(/0+$/g)?.[0].length;
        setZeropad(zeroes ?? 0);
        const pow = BN_TEN.pow(new BN(chainDecimals));
        let value = new BN(parsed).mul(pow).div(BN_TEN.pow(new BN(decimalPoints)));
        setAmount(value);
    }, [setAmount, chainDecimals]);

    useEffect(() => {
        const str = bnToStringDecimal(amount ?? BN_ZERO, chainDecimals);
        const pad = new Array(zeropad + 1).join('0');
        const dot = !str.includes('.') && pad;
        setAmountStr(`${str}${dot ? '.' : ''}${pad}`);
    }, [amount, zeropad, chainDecimals]);

    const reset = useCallback(() => {
        setError(undefined);
        setTxData(undefined);
        setStatus(undefined);
        setDest('');
        setAmountStr('');
      }, []);

    useEffect(() => {
        if (accounts?.allAccounts[0]) {
            setAccount(accounts?.allAccounts[0]);
        };
        api?.query.system.account
        .multi(accounts?.allAccounts)
        .then((infos) => {
            const b = infos.map((info) => info.data.free.add(info.data.reserved));
            const n = infos.map((info) => info.nonce.toNumber());
            setBalances(b);
            setNonces(n);
        })
        .catch((error) => console.error(error));
    }, [accounts?.allAccounts, api?.query?.system?.account, txdata]);

    useEffect(() => {
        if (api) {
            setChainDecimals(api.registry.chainDecimals[0]);
        }
    }, [api]);

    const networkName = useMemo(() => {
        if (network) {
            if (network.includes('xx')) {
                return 'xx blockchain';
            }
            if (network.includes('polkadot')) {
                return 'Polkadot';
            }
        }
        return '???';
    }, [network]);

    const symbol = useMemo(() => {
        if (network) {
            if (network.includes('xx')) {
                return 'XX';
            }
            if (network.includes('polkadot')) {
                return 'DOT';
            }
        }
        return 'Unit';
    }, [network]);

    const submit = useCallback(async () => {
        if (api && proxxy && network && account && dest && amount) {
            setError(undefined);
            setStatus('signing');
            try {        
                // 1. Create transaction
                const pair = keyring.getPair(account);
                const { meta: { source } } = pair;
                const tx = api.tx.balances.transferKeepAlive(dest, amount);
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
                const data = await getExtrinsicData(network, hashStr, proxxy);
                setStatus('included');
                setTxData({
                    network: network,
                    hash: hashStr,
                    block: data.height,
                    timestamp: data.timestamp,
                });
            } catch(err) {
                console.error(err);
                setError((err as string).toString());
            };
        }
    }, [api, proxxy, network, account, dest, amount]);

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
            <Typography variant='h4'>Connected to {networkName}</Typography>
            <br />
            <Typography variant='h6'>Account</Typography>
            <Stack spacing={2}>
                {accounts?.allAccounts?.map((account, index) => (
                    <Typography key={index}>{account.toString()}</Typography>
                ))}
            </Stack>
            <br />
            <Typography variant='h6'>Balance</Typography>
            {(balances && balances.length >= 1 && api) ? (
                <Stack spacing={2} alignSelf={"center"}>
                    {balances?.map((balance, index) => (
                        <Typography key={index}>
                            <FormatBalance value={balance} precision={5} symbol={symbol} denomination={chainDecimals}/>
                        </Typography>
                    ))}
                </Stack>
            ) :(<Loading size='sm' />)}
            <br />
            {!status ? (
                <Stack spacing={2} sx={ { width: "100%" }}>
                    <TextField
                        InputLabelProps={{
                            style: { color: 'cyan', opacity: '0.6' },
                        }}
                        InputProps={{
                            style: { color: inputErr ? 'red' : 'white'},
                        }}
                        fullWidth
                        label="Destination Address"
                        variant="outlined"
                        value={dest}
                        onChange={handleDestChange}
                    />
                    <TextField
                        InputLabelProps={{
                            style: { color: 'cyan', opacity: '0.6' },
                        }}
                        InputProps={{
                            style: { color: inputErr ? 'red' : 'white'},
                        }}
                        type='number'
                        fullWidth
                        label="Amount"
                        variant="outlined"
                        value={amountStr}
                        onChange={handleAmountChange}
                    />
                    <Button
                        onClick={submit}
                        variant='contained'
                        disabled={!api || !account || !dest || !amount || inputErr}
                    >
                        Send Payment
                    </Button>
                </Stack>
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