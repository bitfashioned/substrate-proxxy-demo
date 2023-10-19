import type {
  JsonRpcResponse,
  ProviderInterface,
  ProviderInterfaceCallback,
  ProviderInterfaceEmitCb,
  ProviderInterfaceEmitted,
  ProviderStats,
} from "@polkadot/rpc-provider/types";

import { logger, noop } from "@polkadot/util";

import { RpcCoder } from "./coder/index.js";
import { LRUCache } from "./lru/index.js";
import { relayContact } from "../assets/relay.js";
import { xxmetadata } from "../assets/metadata.js";
import { ProxxyClient, ProxxyClass } from "./client.js";

const ERROR_SUBSCRIBE =
  "Proxxy Provider does not have subscriptions, use WebSockets instead";
const ERROR_CLONE = "Proxxy Provider does not support cloning";

const l = logger("api-proxxy-http");

const encoder = new TextEncoder();
const defaultRelay = encoder.encode(relayContact);

/**
 *
 * @name ProxxyProvider
 *
 * @description The HTTP Provider allows sending requests using HTTP to a HTTP RPC server TCP port. It does not support subscriptions so you won't be able to listen to events such as new blocks or balance changes. It is usually preferable using the [[WsProvider]].
 */
export class ProxxyProvider implements ProviderInterface {
  readonly #callCache = new LRUCache();
  readonly #coder: RpcCoder;
  readonly #stats: ProviderStats;
  readonly #proxxy: ProxxyClient;
  readonly #network: string;
  readonly #relay: Uint8Array;
  #connected: boolean = false;

  /**
   * @param {string} network The network to connect to
   * @param {string} relay The contact information for the relay
   */
  constructor(
    e2eId: number,
    network: string,
    relay: Uint8Array = defaultRelay
  ) {
    this.#coder = new RpcCoder();
    this.#stats = {
      active: { requests: 0, subscriptions: 0 },
      total: {
        bytesRecv: 0,
        bytesSent: 0,
        cached: 0,
        errors: 0,
        requests: 0,
        subscriptions: 0,
        timeout: 0,
      },
    };
    this.#network = network;
    this.#relay = relay;
    // Create proxxy client
    this.#proxxy = new ProxxyClass(e2eId);
  }

  /**
   * @summary `true` when this provider supports subscriptions
   */
  public get hasSubscriptions(): boolean {
    return !!false;
  }

  /**
   * @description Returns a clone of the object
   */
  public clone(): ProxxyProvider {
    l.error(ERROR_CLONE);

    throw new Error(ERROR_CLONE);
  }

  /**
   * @description Manually connect from the connection
   */
  public async connect(): Promise<void> {
    // Connect proxxy client to the given relay
    const networks = await this.#proxxy.connect(this.#relay);
    // Check network is supported
    let supported = false;
    networks.forEach((network) => {
      console.log(`Proxxy: Network - ${network}`);
      if (network === this.#network) {
        supported = true;
      }
    });
    if (!supported) {
      throw new Error(`Network ${this.#network} not supported by relay`);
    }
    this.#connected = true;
  }

  /**
   * @description Manually disconnect from the connection
   */
  public async disconnect(): Promise<void> {
    // TODO: implement?
  }

  /**
   * @description Returns the connection stats
   */
  public get stats(): ProviderStats {
    return this.#stats;
  }

  /**
   * @summary `true` when this provider supports clone()
   */
  public get isClonable(): boolean {
    return !!false;
  }

  /**
   * @summary Whether the provider is connected or not.
   * @return {boolean} true if connected
   */
  public get isConnected(): boolean {
    return this.#connected;
  }

  /**
   * @summary Events are not supported with the HttpProvider, see [[WsProvider]].
   * @description HTTP Provider does not have 'on' emitters. WebSockets should be used instead.
   */
  public on(
    _type: ProviderInterfaceEmitted,
    _sub: ProviderInterfaceEmitCb
  ): () => void {
    l.error(
      "Proxxy Provider does not have 'on' emitters, use WebSockets instead"
    );

    return noop;
  }

  /**
   * @summary Send HTTP POST Request with Body to over Proxxy.
   */
  public async send<T>(
    method: string,
    params: unknown[],
    isCacheable?: boolean
  ): Promise<T> {
    this.#stats.total.requests++;

    // Handle metadata locally
    if (method === "state_getMetadata") {
      return xxmetadata as T;
    }

    const [, body] = this.#coder.encodeJson(method, params);
    let resultPromise: Promise<T> | null = isCacheable
      ? this.#callCache.get(body)
      : null;

    if (!resultPromise) {
      resultPromise = this.#send(body);

      if (isCacheable) {
        this.#callCache.set(body, resultPromise);
      }
    } else {
      this.#stats.total.cached++;
    }

    return resultPromise;
  }

  async #send<T>(body: string): Promise<T> {
    this.#stats.active.requests++;
    this.#stats.total.bytesSent += body.length;

    try {
      const bodyData = encoder.encode(body);
      const [response, len] = await this.#proxxy.request<T>(
        this.#network,
        bodyData
      );

      this.#stats.total.bytesRecv += len;
      const decoded = this.#coder.decodeResponse(
        response as JsonRpcResponse<T>
      );
      this.#stats.active.requests--;

      return decoded;
    } catch (e) {
      this.#stats.active.requests--;
      this.#stats.total.errors++;

      throw e;
    }
  }

  /**
   * @summary Subscriptions are not supported with the HttpProvider, see [[WsProvider]].
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async subscribe(
    _types: string,
    _method: string,
    _params: unknown[],
    _cb: ProviderInterfaceCallback
  ): Promise<number> {
    l.error(ERROR_SUBSCRIBE);

    throw new Error(ERROR_SUBSCRIBE);
  }

  /**
   * @summary Subscriptions are not supported with the HttpProvider, see [[WsProvider]].
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async unsubscribe(
    _type: string,
    _method: string,
    _id: number
  ): Promise<boolean> {
    l.error(ERROR_SUBSCRIBE);

    throw new Error(ERROR_SUBSCRIBE);
  }
}
