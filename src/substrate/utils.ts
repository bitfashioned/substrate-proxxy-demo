import { ProxxyClient } from "../proxxy/client";
import { encoder } from "../cmix/utils";

export const stripNonDigits = <T>(value: T) =>
  typeof value === "string" ? value.replace(/\D+/g, "") || "0" : value;

// Data
interface ExtrinsicData {
  height: number;
  timestamp: string;
}

interface GraphQLResponse<T> {
  data: T;
}

// XX indexer
interface XXResponseData {
  extrinsic: {
    block_number: number;
    timestamp: number;
  }[];
}

// Polkadot indexer
interface PolkadotResponseData {
  extrinsicsConnection: {
    edges: {
      node: {
        block: {
          height: number;
          timestamp: string;
        };
      };
    }[];
  };
}

export const getExtrinsicData = async (
  network: string,
  hash: string,
  client: ProxxyClient
): Promise<ExtrinsicData> => {
  let query: string;
  const variables = { hash };
  let payload: any;
  // Build query
  switch (network) {
    case "/xx/mainnet":
      query = `
      query MyQuery($hash: String = "") {
        extrinsic(where: {hash: {_eq: $hash}}) {
          block_number
          timestamp
        }
      }
    `;
      break;
    case "/polkadot/mainnet":
      query = `
      query MyQuery($hash: String = "") {
        extrinsicsConnection(orderBy: id_ASC, where: {hash_eq: $hash}) {
          edges {
            node {
              block {
                height
                timestamp
              }
            }
          }
        }
      }      
    `;
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
  payload = {
    query,
    variables,
  };
  // Do proxxy request
  const request = JSON.stringify(payload);
  const data = encoder.encode(request);
  let tries = 1;
  while (true) {
    const [response] = await client.request(
      network.replace("mainnet", "indexer"),
      data
    );
    // Parse response
    try {
      switch (network) {
        case "/xx/mainnet":
          return parseXXResponse(response);
        case "/polkadot/mainnet":
          return parsePolkadotResponse(response);
        default:
          throw new Error(`Unsupported network: ${network}`);
      }
    } catch (e) {
      tries++;
      if (tries > 3) {
        throw e;
      }
    }
  }
};

const parseXXResponse = (response: any): ExtrinsicData => {
  const resp = response as GraphQLResponse<XXResponseData>;
  const respData = resp.data.extrinsic[0];
  const date = new Date(respData.timestamp);
  return {
    height: respData.block_number,
    timestamp: date.toLocaleString(),
  };
};

const parsePolkadotResponse = (response: any): ExtrinsicData => {
  const resp = response as GraphQLResponse<PolkadotResponseData>;

  const respData = resp.data.extrinsicsConnection.edges[0].node.block;
  const date = new Date(respData.timestamp);
  return {
    height: respData.height,
    timestamp: date.toLocaleString(),
  };
};
