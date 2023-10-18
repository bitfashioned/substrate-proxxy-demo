import useCmix, { NetworkStatus } from '../hooks/useCmix';
import type { WithChildren } from '../types';
import React, { FC, useCallback, useEffect, useState, useRef } from 'react';
import { useUtils } from './utils-context';
import { encoder, decoder } from '../utils';

export type ProxxyClient = {
    ready: boolean;
    connect: (relay: Uint8Array) => Promise<string[]>;
    supportedNetworks: () => string[];
    request: (network: string, data: Uint8Array) => Promise<any>;
}

export const ProxxyContext = React.createContext<ProxxyClient>(
    {} as ProxxyClient
);

type ProxxyRequest = {
    recipient: Uint8Array;
    uri: string;
    method: number;
    data?: Uint8Array;
}

const pw = encoder.encode('12345678901234567890');

export const ProxxyProvider: FC<WithChildren> = ({ children }) => {
    const [networks, setNetworks] = useState<string[]>([]);
    const {
        cmix,
        e2eId,
        status: cmixStatus,
        initialize,
    } = useCmix();
    const { utils } = useUtils();
    const [ recipient, setRecipient ] = useState<Uint8Array>();
    const calledInit = useRef(false);
    const [ ready, setReady ] = useState(false);

    // Internal
    const proxxyRequest = useCallback(async (req: ProxxyRequest): Promise<any> => {
        console.log('Proxxy: proxxyRequest');
        if (
            cmix &&
            utils &&
            e2eId !== undefined &&
            ready
        ) {
            // Build request
            console.log('Proxxy: Building request');
            // Encode data
            const dataStr = req.data ? utils.Uint8ArrayToBase64(req.data) : '';
            const request = {
                Version: 1,
                Headers: '',
                Content: dataStr,
                Method: req.method,
                URI: req.uri,
                Error: '',
            };
            const reqStr = JSON.stringify(request);
            console.log(`Proxxy: Request: ${reqStr}`);
            const reqBytes = encoder.encode(reqStr);

            // Send request
            console.log('Proxxy: Sending request');
            const params = utils.GetDefaultSingleUseParams();
            const response = await utils.RequestRestLike(e2eId, req.recipient, reqBytes, params);

            // Parse response
            console.log('Proxxy: Parsing response');
            const respStr = decoder.decode(response);
            const resp = JSON.parse(respStr);
            const contentBytes = utils.Base64ToUint8Array(resp.content);
            const contentStr = decoder.decode(contentBytes);
            const content = JSON.parse(contentStr);
            return content;
        } else {
            console.log('Proxxy: Not ready');
            return null;
        }
    }, [cmix, utils, e2eId, ready]);

    // Connect
    const connect = useCallback(async (relay: Uint8Array) => {
        // Connect to relay and get networks
        console.log('Proxxy: Connecting');
        const req: ProxxyRequest = {
            recipient: relay,
            uri: '/networks',
            method: 1, // GET
        }
        const networks = await proxxyRequest(req);
        console.log(`Proxxy: Networks: ${networks}`)
        if (networks != null) {
            setNetworks(networks as string[]);
            setRecipient(relay);
        }
        return networks as string[];
    }, [proxxyRequest, setNetworks, setRecipient]);

    // Networks
    const supportedNetworks = useCallback(() => {
        return networks;
    }, [networks]);

    // Request
    const request = useCallback(async (network: string, data: Uint8Array): Promise<any> => {
        console.log('Proxxy: request');
        if (recipient) {
            console.log('Proxxy: Sending request');
            return proxxyRequest({
                recipient,
                uri: network,
                method: 2, // POST
                data,
            });
        } else {
            console.log('Proxxy: Recipient not set yet');
            return null;
        }
    }, [recipient, proxxyRequest]);

    // Update ready
    useEffect(() => {
        setReady(cmixStatus === NetworkStatus.CONNECTED);
    }, [cmixStatus]);

    // Initialize cmix once
    useEffect(() => {
        async function initCmix() {
            console.log('Proxxy: initializing cmix');
            calledInit.current = true;
            await initialize(pw);
        }
        if (!calledInit.current) {
            initCmix();
        }
    }, [initialize]);

    return (
        <ProxxyContext.Provider
        value={{
            ready,
            connect,
            supportedNetworks,
            request,
        }}
        >
        {children}
        </ProxxyContext.Provider>
    );
};

export const useProxxy = () => {
    const context = React.useContext(ProxxyContext);

    if (context === undefined) {
        throw new Error('useProxxy must be used within a ProxxyProvider');
    }

    return context;
};
  