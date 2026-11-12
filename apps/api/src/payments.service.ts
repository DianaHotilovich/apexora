import { Injectable, Logger } from '@nestjs/common';
import { PaymentMethod } from '@driftora/shared';
export { methodsFor, BNPL_BY_COUNTRY } from '@driftora/shared';

export interface PaymentResult { provider: string; providerRef: string; status: 'authorised' | 'pending' | 'scheduled'; redirectUrl?: string }

/**
 * Payment provider. Without ADYEN_API_KEY the app runs a safe test provider (no money moves).
 * With Adyen test credentials it creates a real Adyen Checkout session in the TEST environment.
 */
@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);

  async charge(method: PaymentMethod, amountMinor: number, currency: string, reference: string): Promise<PaymentResult> {
    const key = process.env.ADYEN_API_KEY;
    const account = process.env.ADYEN_MERCHANT_ACCOUNT;
    if (method === 'save_up') return { provider: 'driftora', providerRef: `save-${reference}`, status: 'scheduled' };
    if (!key || !account) {
      return { provider: 'test', providerRef: `test-${reference}`, status: method === 'pay_now' ? 'authorised' : 'pending' };
    }
    const res = await fetch('https://checkout-test.adyen.com/v71/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
      body: JSON.stringify({
        merchantAccount: account,
        amount: { value: amountMinor, currency },
        reference,
        returnUrl: process.env.PAYMENT_RETURN_URL || 'http://localhost:3000/checklist',
      }),
    });
    if (!res.ok) {
      this.log.error(`Adyen session failed: HTTP ${res.status}`);
      throw new Error('Payment provider error');
    }
    const body = (await res.json()) as { id: string; url?: string };
    return { provider: 'adyen-test', providerRef: body.id, status: 'pending', redirectUrl: body.url };
  }
}
