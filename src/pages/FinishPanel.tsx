import { FC } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import Loading from '../substrate/components/Loading';
import Link from '../substrate/components/Link';

export type TxStatus = 'signing' | 'sending' | 'confirming' | 'included';
export interface TxData {
  hash: string;
  block: number;
  timestamp: number;
}

type Props = {
  error?: string;
  account: string;
  status?: TxStatus;
  txdata?: TxData;
  reset: () => void;
};

const FinishPanel: FC<Props> = ({ account, error, txdata, status, reset }) => {
  const date = new Date(txdata?.timestamp || 0);
  if (error) {
    return (
      <>
        <Stack spacing={4} sx={{ pb: 10, textAlign: 'center' }}>
          <Alert severity='error'>
            {error}
          </Alert>
        </Stack>
        <Box sx={{ textAlign: 'right' }}>
          <Button onClick={reset} variant='contained'>
            Go back
          </Button>
        </Box>
      </>
    )
  }

  if (status === 'signing') {
    return (
      <Stack spacing={4} sx={{ p: 3, textAlign: 'center' }}>
        <Loading size='md' />
        <Typography variant='h3' sx={{ mt: 2, fontSize: '1.25rem' }}>
          <>Please sign the transaction...</>
        </Typography>
      </Stack>
    );
  }

  if (status === 'sending') {
    return (
      <Stack spacing={4} sx={{ p: 3, textAlign: 'center' }}>
        <Loading size='md' />
        <Typography variant='h3' sx={{ mt: 2, fontSize: '1.25rem' }}>
          <>Sending transaction over cMixx...</>
        </Typography>
      </Stack>
    );
  }

  if (status === 'confirming') {
    return (
      <Stack spacing={4} sx={{ p: 3, textAlign: 'center' }}>
        <Loading size='md' />
        <Typography variant='h3' sx={{ mt: 2, fontSize: '1.25rem' }}>
            <>Waiting for transaction to be included in a block...</>
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Typography variant='h2' sx={{fontSize: {xs: '22px', md: '30px'}, textAlign: {xs: 'center', md: 'left'}}}>Transaction Complete!</Typography>
      <Typography variant='h3' sx={{ fontSize: '1rem' }}>
        Your <Link to={`https://explorer.xx.network/extrinsics/${txdata?.hash}`}>transaction</Link> was included in block <Link to={`https://explorer.xx.network/blocks/${txdata?.block}`}>{txdata?.block}</Link> on {date.toLocaleString()}.
      </Typography>
      <Typography variant='h3' sx={{ fontSize: '1rem' }}>
        Check your account <Link to={`https://explorer.xx.network/accounts/${account}`}>here</Link>.
      </Typography>
      <Box sx={{ p: 4 }} />
      <Box sx={{ textAlign: 'right' }}>
        <Button onClick={reset} variant='contained'>
          Done
        </Button>
      </Box>
    </Stack>
  );
};

export default FinishPanel;
