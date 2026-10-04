import { describe, it, expect } from 'vitest';
import { validateOUISection } from '../../../../src/core/learning-engine/validation/oui-gateway';

const source = (step: string) => `
root = Flowchart("Refs", [buyer], [shop, bank], [s1], [j])
buyer = Actor("buyer", "Buyer", "Buys")
shop = System("shop", "Shop", "Sells", "aggregate")
bank = System("bank", "Bank", "Pays", "external")
s1 = ${step}
j = Journey("j", "J", "J", [JourneyStep(s1, "S1", "S1")])
`;
const diag = (step: string, field: string) =>
  validateOUISection(source(step)).diagnostics.find(d => d.field?.endsWith(field));

describe('step reference checks', () => {
  it('rejects delegatesTo that names an actor and points to sendsTo or initiatedBy', () => {
    const d = diag('Step("s1", "On order", "Sell", shop, [Event("sold", "Sold")], buyer, "buyer")', '.delegatesTo');
    expect(d?.message).toContain('which is an actor');
    expect(d?.fixHint).toContain('sendsTo');
  });

  it('accepts delegatesTo that names a system', () => {
    expect(diag('Step("s1", "On order", "Sell", shop, [Event("sold", "Sold")], buyer, bank)', '.delegatesTo')).toBeUndefined();
  });

  it('rejects initiatedBy that names something other than an actor', () => {
    const d = diag('Step("s1", "On order", "Sell", shop, [Event("sold", "Sold")], "sold")', '.initiatedBy');
    expect(d?.message).toContain('"sold"');
    expect(d?.fixHint).toContain('"buyer"');
  });
});
