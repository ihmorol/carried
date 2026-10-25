import type { LinePayload } from "../line";

/** An editorial seed line: fixed fields, deterministic slug id. */
export type Seed = Omit<LinePayload, "v">;
