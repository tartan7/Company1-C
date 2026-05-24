export async function simulateUpstreamCall(mode: string): Promise<{ ok: true }> {
  if (mode === 'timeout') {
    const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS || '2000');
    await new Promise((resolve) => setTimeout(resolve, timeoutMs + 10));
    throw new Error('timeout');
  }

  if (mode === 'error') {
    throw new Error('upstream error');
  }

  return { ok: true };
}
