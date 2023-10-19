import { encoder, decoder } from "../cmix/utils";

export interface ProxxyClient {
  connect(relay: Uint8Array): Promise<string[]>;
  supportedNetworks(): string[];
  request<T = any>(network: string, data: Uint8Array): Promise<[T, number]>;
}

export class ProxxyClass implements ProxxyClient {
  readonly #e2eId: number;
  readonly #params: Uint8Array;
  #networks: string[] = [];
  #recipient: Uint8Array = new Uint8Array();

  constructor(e2eId: number) {
    this.#e2eId = e2eId;
    if (window.utils) {
      this.#params = window.utils.GetDefaultSingleUseParams();
    } else {
      throw new Error("XXDK not initialized");
    }
  }

  public async connect(relay: Uint8Array): Promise<string[]> {
    console.log("Proxxy: Connecting");
    const req: ProxxyRequest = {
      recipient: relay,
      uri: "/networks",
      method: 1, // GET
    };
    const [networks] = await this.#request<string[]>(req);
    console.log(`Proxxy: Networks: ${networks}`);
    this.#networks = networks;
    this.#recipient = relay;
    return networks;
  }

  public supportedNetworks(): string[] {
    return this.#networks;
  }

  public async request<T = any>(
    network: string,
    data: Uint8Array
  ): Promise<[T, number]> {
    console.log("Proxxy: Sending request");
    const req: ProxxyRequest = {
      recipient: this.#recipient,
      uri: network,
      method: 2, // POST
      data: data,
    };
    return this.#request(req);
  }

  async #request<T = any>(req: ProxxyRequest): Promise<[T, number]> {
    // Build request
    console.log("Proxxy: Building request");
    // Encode data
    const dataStr = req.data ? window.utils?.Uint8ArrayToBase64(req.data) : "";
    const request = {
      Version: 1,
      Headers: "",
      Content: dataStr,
      Method: req.method,
      URI: req.uri,
      Error: "",
    };
    const reqStr = JSON.stringify(request);
    console.log(`Proxxy: Request: ${reqStr}`);
    const reqBytes = encoder.encode(reqStr);

    // Send request
    console.log("Proxxy: Sending request");
    const response = await window.utils?.RequestRestLike(
      this.#e2eId,
      req.recipient,
      reqBytes,
      this.#params
    );

    // Parse response
    console.log("Proxxy: Parsing response");
    const respStr = decoder.decode(response);
    const resp = JSON.parse(respStr);
    const contentBytes = window.utils?.Base64ToUint8Array(resp.content);
    const contentStr = decoder.decode(contentBytes);
    const content = JSON.parse(contentStr);
    return [content, contentBytes?.length || 0];
  }
}

type ProxxyRequest = {
  recipient: Uint8Array;
  uri: string;
  method: number;
  data?: Uint8Array;
};
