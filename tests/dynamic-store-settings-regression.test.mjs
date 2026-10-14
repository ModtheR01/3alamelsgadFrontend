import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Test Suite: Dynamic Store Settings across Website, Dashboard & Checkout

test('Dynamic Store Settings - Codebase and End-to-End Contracts', async (t) => {
  const rootDir = path.resolve(process.cwd());

  await t.test('1. Dashboard settings types follow refactored contract: payment_wallets as single source of truth', () => {
    const dashboardTypes = fs.readFileSync(path.join(rootDir, 'types/dashboard.ts'), 'utf8');
    // Must NOT have instapay_number or working_hours at root level
    assert.ok(!dashboardTypes.includes('instapay_number?: string'), 'Must remove instapay_number from root of DashboardSettings');
    assert.ok(!dashboardTypes.includes('working_hours?: string'), 'Must remove working_hours from root of DashboardSettings');

    // Must include payment_wallets and root contact fields
    assert.ok(dashboardTypes.includes('payment_wallets?:'), 'Must include payment_wallets in DashboardSettings');
    assert.ok(dashboardTypes.includes('phone?: string'), 'Must include phone in DashboardSettings');
    assert.ok(dashboardTypes.includes('whatsapp?: string'), 'Must include whatsapp in DashboardSettings');
    assert.ok(dashboardTypes.includes('address?: string'), 'Must include address in DashboardSettings');
    assert.ok(dashboardTypes.includes('InstaPayWallet'), 'Must define InstaPayWallet interface');

    const indexTypes = fs.readFileSync(path.join(rootDir, 'types/index.ts'), 'utf8');
    assert.ok(indexTypes.includes('number?: string'), 'Must include number?: string in instapay paymentMethods');
  });

  await t.test('2. SettingsSection UI reflects Electronic Wallet label, InstaPay address, and InstaPay number fields', () => {
    const settingsSection = fs.readFileSync(
      path.join(rootDir, 'components/admin/SettingsSection.tsx'),
      'utf8'
    );
    // Electronic wallet label check
    assert.ok(
      settingsSection.includes('رقم المحفظة الإلكترونية'),
      'Label must be updated to "رقم المحفظة الإلكترونية"'
    );
    assert.ok(
      settingsSection.includes('مثال: فودافون كاش'),
      'Must contain helper/placeholder text "مثال: فودافون كاش"'
    );
    // InstaPay number field check
    assert.ok(
      settingsSection.includes('رقم إنستا باي'),
      'Must contain independent field labeled "رقم إنستا باي"'
    );
    assert.ok(
      settingsSection.includes('عنوان إنستاباي'),
      'Must contain dedicated InstaPay address field'
    );
    assert.ok(
      settingsSection.includes('instapayNumber'),
      'Must maintain state for instapayNumber'
    );
    assert.ok(
      settingsSection.includes('instapayAddress'),
      'Must maintain state for instapayAddress'
    );
    assert.ok(
      settingsSection.includes('walletNumber'),
      'Must maintain state for walletNumber'
    );
  });

  await t.test('3. CheckoutView dynamically displays Electronic Wallet and InstaPay details from settings with copy action', () => {
    const checkoutView = fs.readFileSync(
      path.join(rootDir, 'components/CheckoutView.tsx'),
      'utf8'
    );
    // Destructuring settings
    assert.ok(
      checkoutView.includes('settings,') || checkoutView.includes('settings'),
      'CheckoutView must consume settings from store'
    );
    // Dynamic payment rendering
    assert.ok(
      checkoutView.includes('settings.paymentMethods?.instapay?.address'),
      'InstaPay address must be dynamically retrieved from settings'
    );
    assert.ok(
      checkoutView.includes('settings.paymentMethods?.instapay?.number'),
      'InstaPay number must be dynamically retrieved from settings'
    );
    assert.ok(
      checkoutView.includes('settings.paymentMethods?.mobileWallet?.number') ||
      checkoutView.includes('settings.paymentMethods?.vodafoneCash?.number'),
      'Electronic wallet number must be dynamically retrieved from settings'
    );
    // Copy functionality
    assert.ok(
      checkoutView.includes("copyToClipboard(settings.paymentMethods.instapay.address, 'instapay_address')"),
      'Must provide copy functionality for dynamic InstaPay address'
    );
    assert.ok(
      checkoutView.includes("copyToClipboard(settings.paymentMethods.instapay.number!, 'instapay_number')"),
      'Must provide copy functionality for dynamic InstaPay number'
    );
    // No hardcoded phone in wallet instructions
    assert.ok(
      !checkoutView.includes('<span className="font-mono font-bold text-sm text-[#251811]">01010750072</span>'),
      'Hardcoded wallet number 01010750072 must be removed'
    );
  });

  await t.test('4. OrderConfirmationView dynamically renders InstaPay, wallet info, copy actions, and WhatsApp proof link', () => {
    const confirmationView = fs.readFileSync(
      path.join(rootDir, 'components/OrderConfirmationView.tsx'),
      'utf8'
    );
    assert.ok(
      confirmationView.includes('dynamicInstapayAddress'),
      'Must use dynamic InstaPay address in order confirmation'
    );
    assert.ok(
      confirmationView.includes('dynamicInstapayNumber'),
      'Must use dynamic InstaPay number in order confirmation'
    );
    assert.ok(
      confirmationView.includes('dynamicWalletNumber'),
      'Must use dynamic wallet number in order confirmation'
    );
    assert.ok(
      confirmationView.includes('whatsappTargetNumber'),
      'Must use dynamic WhatsApp number for confirmation proof CTA'
    );
    assert.ok(
      confirmationView.includes('copyToClipboard'),
      'Must provide copyToClipboard functionality for payment details'
    );
  });

  await t.test('5. Footer, Navbar, Floating Concierge, and ContactView dynamically display phone, address, and hours', () => {
    const footer = fs.readFileSync(path.join(rootDir, 'components/Footer.tsx'), 'utf8');
    assert.ok(footer.includes('whatsappUrl'), 'Footer WhatsApp URL must be dynamic');
    assert.ok(footer.includes('displayAddress'), 'Footer address must be dynamic');
    assert.ok(footer.includes('displayPhone'), 'Footer phone must be dynamic');
    assert.ok(footer.includes('displayHours'), 'Footer working hours must be dynamic');

    const appPage = fs.readFileSync(path.join(rootDir, 'app/page.tsx'), 'utf8');
    assert.ok(appPage.includes('floatingWhatsappUrl'), 'Floating concierge WhatsApp URL must be dynamic');

    const contactView = fs.readFileSync(path.join(rootDir, 'components/ContentPages.tsx'), 'utf8');
    assert.ok(contactView.includes('displayAddress'), 'Contact page showroom address must be dynamic');
    assert.ok(contactView.includes('displayPhone'), 'Contact page phone must be dynamic');
    assert.ok(contactView.includes('displayHours'), 'Contact page working hours must be dynamic');
    assert.ok(contactView.includes('whatsappUrl'), 'Contact page WhatsApp button must be dynamic');

    const homeSections = fs.readFileSync(path.join(rootDir, 'components/HomeSections.tsx'), 'utf8');
    assert.ok(homeSections.includes('displayAddress'), 'Home showroom address must be dynamic');
    assert.ok(homeSections.includes('displayHours'), 'Home showroom hours must be dynamic');
    assert.ok(homeSections.includes('displayPhone'), 'Home showroom phone must be dynamic');
  });

  await t.test('6. StoreContext updates backend via payment_wallets and never sends removed root fields', () => {
    const store = fs.readFileSync(path.join(rootDir, 'lib/store.tsx'), 'utf8');
    // Must NOT send removed root-level fields
    assert.ok(!store.includes('dashboardPatch.instapay_number ='), 'Must NOT send instapay_number in updateSettings patch');
    assert.ok(!store.includes('dashboardPatch.working_hours ='), 'Must NOT send working_hours in updateSettings patch');

    // Must send independent contact fields
    assert.ok(store.includes('dashboardPatch.phone ='), 'Must send phone in updateSettings patch');
    assert.ok(store.includes('dashboardPatch.whatsapp ='), 'Must send whatsapp in updateSettings patch');
    assert.ok(store.includes('dashboardPatch.address ='), 'Must send address in updateSettings patch');
    assert.ok(store.includes('dashboardPatch.payment_wallets ='), 'Must send payment_wallets in updateSettings patch');

    // Must initialize fields from backend
    assert.ok(store.includes('data.phone'), 'Must initialize phone from backend');
    assert.ok(store.includes('data.whatsapp'), 'Must initialize whatsapp from backend');
    assert.ok(store.includes('data.address'), 'Must initialize address from backend');
    assert.ok(!store.includes('data.working_hours'), 'Must NOT read removed working_hours from backend');
    assert.ok(!store.includes('data.instapay_number'), 'Must NOT read removed instapay_number from backend');
    assert.ok(store.includes('wallets.instapay'), 'Must initialize instapay from wallets.instapay');
  });
});
