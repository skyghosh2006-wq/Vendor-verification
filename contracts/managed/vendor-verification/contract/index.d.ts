import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  setMinimumScore(context: __compactRuntime.CircuitContext<PS>,
                  newScore_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verifyVendor(context: __compactRuntime.CircuitContext<PS>,
               vendorSecret_0: Uint8Array,
               complianceScore_0: bigint,
               taxIdHash_0: Uint8Array,
               timestamp_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  setMinimumScore(context: __compactRuntime.CircuitContext<PS>,
                  newScore_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verifyVendor(context: __compactRuntime.CircuitContext<PS>,
               vendorSecret_0: Uint8Array,
               complianceScore_0: bigint,
               taxIdHash_0: Uint8Array,
               timestamp_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  setMinimumScore(context: __compactRuntime.CircuitContext<PS>,
                  newScore_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verifyVendor(context: __compactRuntime.CircuitContext<PS>,
               vendorSecret_0: Uint8Array,
               complianceScore_0: bigint,
               taxIdHash_0: Uint8Array,
               timestamp_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly totalVerifiedVendors: bigint;
  readonly lastVerificationTimestamp: bigint;
  readonly lastVerifiedCommitment: Uint8Array;
  readonly minimumScoreRequirement: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
