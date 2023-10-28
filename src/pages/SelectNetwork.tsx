import {
    Box,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
} from '@mui/material';
import xx_logo from '../assets/whiteLogo.png';

type Network = {
    name: string
    network: string
    icon: string
}

const Networks: Network[] = [
    // Polkadot
    {
        name: 'Polkadot',
        network: '/polkadot/mainnet',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polkadot/info/logo.png'
    },
    // XX Network
    {
        name: 'xx network',
        network: '/xx/mainnet',
        icon: xx_logo
    },
]

interface Props {
    networkSetter: (network: string) => void
}

export const SelectNetwork = ({ networkSetter }: Props) => {
    return (
    <Stack alignItems={'center'} spacing={2} sx={{ minWidth: 'inherit' }}>
        <TableContainer title={'Supported Networks'}>
            <Table sx={{ overflowY: 'scroll', backgroundColor: 'cyan' }} aria-label='Supported Networks Table'>
                <TableBody>
                    {Object.values(Networks).map((network: Network) => (
                    <TableRow key={network.name}>
                        <TableCell width="15%">
                            <Box>
                                <img width='30' alt='icon' src={network.icon} />
                            </Box>
                        </TableCell>
                        <TableCell width="65%" align='center'><Typography variant='h6'>{network.name}</Typography></TableCell>
                        <TableCell width="20%">
                            <IconButton
                                onClick={() => networkSetter(network.network)}
                                sx={{ backgroundColor: 'black' }}
                            >
                            </IconButton>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Stack>
    );
}
