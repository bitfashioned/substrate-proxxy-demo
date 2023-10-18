# Shredexx on Substrate

This is a demo of using Proxxy to sign a Substrate-based payment and submitting it to a Substrate-based network (Polkadot as per example) over the cMix mixnet from xx network.

The xx network provides a library called xxDK to interact with the cMix mixnet. This library is written in golang, but it includes bindings to wasm, which can be used in a browser. This demo uses the xxDK WASM binary and starts a WASM runner to connect to the mixnet directly from the webapp. This allows for generic data passing over the mixnet, which completely delinks the sender from receiver, protecting user's metadata (timestamps, IP address, etc...).

Data sent over cMix is stored in gateways, and xxDK handles automatically picking up data from gateways. This is useful for a client-side only app, for example a messaging app, where both ends of the communication are users. In the case of interacting with a blockchain, the receiver is a JSON-RPC HTTP server. This way, in order to support blockchain interactions, xx network's team built a service called [Proxxy](https://xxnetwork.wiki/Proxxy). This service is a simple API for sending requests to supported blockchain networks over cMix to a relay server, which then submits the request to the desired blockchain.

This demo includes a Proxxy client that uses the xxDK WASM in order to communicate with the relay server, directly from the webapp.
This is the first instance of using Proxxy this way, since previously it was necessary to have this client embedded into a desktop app.

## Running the demo

To run the demo, use `npm` to install dependencies, build the vite react app, and then start a local development server.

```console
npm i
npm run build
npm run dev
```