import * as xx from "./xxnetwork";
import * as dot from "./polkadot";
export interface NetworkData {
  name: string;
  metadata: string;
  genesisHash: string;
  methods: any;
  properties: any;
  runtimeVersion: any;
}

export const xxnetwork: NetworkData = {
  name: xx.name,
  metadata: xx.metadata,
  genesisHash: xx.genesisHash,
  methods: xx.methods,
  properties: xx.properties,
  runtimeVersion: xx.runtimeVersion,
};

export const polkadot: NetworkData = {
  name: dot.name,
  metadata: dot.metadata,
  genesisHash: dot.genesisHash,
  methods: dot.methods,
  properties: dot.properties,
  runtimeVersion: dot.runtimeVersion,
};
