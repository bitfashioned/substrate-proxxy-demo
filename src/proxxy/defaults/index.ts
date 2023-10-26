import * as xx from "./xxnetwork";
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
