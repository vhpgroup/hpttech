import { getPayload, type Payload } from "payload";
import config from "../payload.config.ts";

let payloadClientPromise: Promise<Payload> | null = null;

export async function getPayloadClient() {
  if (!payloadClientPromise) {
    payloadClientPromise = getPayload({ config });
  }

  return payloadClientPromise;
}
