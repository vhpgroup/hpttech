function getPayloadReadMessage(error: unknown) {
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : undefined;
  const rawMessage = cause instanceof Error ? cause.message : error instanceof Error ? error.message : String(error);

  return rawMessage.split("\n")[0].slice(0, 240);
}

export function shouldFailOnPayloadReadError() {
  if (process.env.PAYLOAD_ALLOW_EMPTY_FALLBACK === "true") return false;
  if (process.env.PAYLOAD_STRICT_READS === "false") return false;
  if (process.env.PAYLOAD_STRICT_READS === "true") return true;

  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
}

export function handlePayloadReadError(scope: string, error: unknown) {
  const message = getPayloadReadMessage(error);

  if (process.env.NODE_ENV === "production") {
    console.error(`[payload-read:${scope}] ${message}`);
  } else if (process.env.PAYLOAD_DEBUG_READ_ERRORS === "true") {
    console.warn(`[payload-read:${scope}] ${message}`);
  }

  if (shouldFailOnPayloadReadError()) {
    throw new Error(`Payload read failed for ${scope}: ${message}`);
  }
}
