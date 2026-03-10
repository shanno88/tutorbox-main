export async function checkEntitlement(email: string, product: string) {
  const res = await fetch('/api/entitlements/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, product }),
  });

  if (!res.ok) {
    throw new Error('network_error');
  }

  return (await res.json()) as { allowed: boolean; reason?: string };
}
