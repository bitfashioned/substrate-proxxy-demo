import { ProxxyClient } from "../proxxy/client";
import { encoder } from "../cmix/utils";

export const stripNonDigits = <T>(value: T) =>
  typeof value === "string" ? value.replace(/\D+/g, "") || "0" : value;

interface GraphQLResponse<T> {
  data: {
    extrinsic: T[];
  };
}

interface ExtrinsicData {
  block_number: number;
  timestamp: number;
}

export const getExtrinsicData = async (
  hash: string,
  client: ProxxyClient
): Promise<ExtrinsicData> => {
  const query = `
    query MyQuery($hash: String = "") {
      extrinsic(where: {hash: {_eq: $hash}}) {
        block_number
        timestamp
      }
    }
  `;
  const variables = { hash };
  const payload = {
    query,
    variables,
  };
  const request = JSON.stringify(payload);
  const data = encoder.encode(request);
  const [response] = await client.request("/xx/indexer", data);
  try {
    const resp = response as GraphQLResponse<ExtrinsicData>;
    return resp.data.extrinsic[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};
