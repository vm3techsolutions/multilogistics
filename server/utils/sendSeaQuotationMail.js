const { sendEmail } = require('../config/sendEmail');
const path = require('path');

const formatAmount = (v) => {
  if (v === null || v === undefined) return '0.00';
  const n = Number(v);
  return isNaN(n) ? String(v) : n.toFixed(2);
};

const sendSeaQuotationMail = async (customerEmail, quotation) => {
  const subject = `Sea Quotation ${quotation.quote_no} - Ready for Approval`;

  const th = 'padding:10px; text-align:center; border:1px solid #ddd;';
  const td = 'padding:10px; text-align:center; border:1px solid #ddd;';

  const packagesRows =
    quotation.packages
      ?.map(
        (p) => `
      <tr>
        <td style="${td}">${p.length}</td>
        <td style="${td}">${p.width}</td>
        <td style="${td}">${p.height}</td>
        <td style="${td}">${p.same_size}</td>
      </tr>`
      )
      .join('') || '';

  const freightCharges = quotation.charges?.filter((c) => c.type === 'freight') || [];

  // Sum amounts in original currency and INR if available
  const totalCurrency = freightCharges.reduce((sum, c) => sum + (Number(c.amount_currency || 0)), 0);
  const totalINRFromCharges = freightCharges.reduce((sum, c) => sum + (Number(c.amount || 0)), 0);

  const freightRows = freightCharges
    .map((c) => `
    <tr>
      <td style="${td}">${c.charge_name}</td>
      <td style="${td}">${c.rate_per_kg || ''}</td>
      <td style="${td}">${c.weight_kg || ''}</td>
      <td style="${td}">${quotation.currency || 'USD'} ${formatAmount(c.amount_currency)}</td>
      <td style="${td}">₹${formatAmount(c.amount)}</td>
    </tr>`)
    .join('');

  const destinationRows =
    quotation.charges
      ?.filter((c) => c.type === 'destination')
      .map(
        (c) => `
      <tr>
        <td style="${td}">${c.charge_name}</td>
        <td style="${td}">₹${formatAmount(c.amount)}</td>
      </tr>`
      )
      .join('') || '';

  const totalDestination = quotation.charges
    ?.filter((c) => c.type === 'destination')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

  const clearanceRows =
    quotation.charges
      ?.filter((c) => c.type === 'clearance')
      .map(
        (c) => `
      <tr>
        <td style="${td}">${c.charge_name}</td>
        <td style="${td}">₹${formatAmount(c.amount)}</td>
      </tr>`
      )
      .join('') || '';

  const totalClearance = quotation.charges
    ?.filter((c) => c.type === 'clearance')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

  const totalDestinationClearance = totalDestination + totalClearance;

  const subtotalINR = Number(quotation.final_total || 0);
  const gst = subtotalINR * 0.18;
  const grandTotal = subtotalINR;

  const html = `
  <div style="font-family: Arial; max-width:650px; margin:auto; border:1px solid #ddd; border-radius:12px; padding:20px; background:#ffffff">

    <h2 style="text-align:center; color:#003366; margin-top:20px;">Sea Export Quotation</h2>
    <p style="text-align:center; color:#444;">Your sea quotation is ready. Please review and approve.</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #e5e7eb; margin-bottom:10px;">
    <tr>
      <td width="40%" style="padding:10px;">
        <img src="cid:mllogo" alt="Logo" style="height:80px; display:block;" />
      </td>

      <td width="60%" style="text-align:right; font-size:14px; color:#333; padding:10px;">
        <p><strong>Quotation No:</strong> ${quotation.quote_no}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
        <p><strong>POL:</strong> ${quotation.pol || ''}</p>
        <p><strong>POD:</strong> ${quotation.pod || ''}</p>
        <p><strong>Incoterms:</strong> ${quotation.incoterms || ''}</p>
        <p><strong>Currency:</strong> ${quotation.currency || 'USD'}</p>
        <p><strong>Exchange Rate:</strong> ${quotation.exchange_rate || ''}</p>
      </td>
    </tr>
  </table>

    <div style="display:flex; gap:15px; margin-top:20px;">

      <div style="width:50%; background:#f9fafb; padding:12px; border-radius:10px; border:1px solid #e5e7eb;">
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${quotation.customer_name}</p>
        <p><strong>Email:</strong> ${quotation.customer_email}</p>
        <p><strong>Phone:</strong> ${quotation.customer_phone}</p>
        <p><strong>Address:</strong> ${quotation.address || quotation.customer_address || ''}</p>
      </div>

      <div style="width:50%; background:#f9fafb; padding:12px; border-radius:10px; border:1px solid #e5e7eb;">
        <h3>Shipment Details</h3>
        <p><strong>Actual Weight:</strong> ${quotation.actual_weight || ''} kg</p>
        <p><strong>Chargeable Weight:</strong> ${quotation.chargeable_weight || ''} kg</p>
        <p><strong>Packages:</strong> ${quotation.packages?.length || 0}</p>
      </div>

    </div>

    <h3 style="margin-top:25px;">Packages</h3>
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="background:#1C5070; color:white;">
          <th style="${th}">Length</th>
          <th style="${th}">Width</th>
          <th style="${th}">Height</th>
          <th style="${th}">Qty</th>
        </tr>
      </thead>
      <tbody>${packagesRows}</tbody>
    </table>

    <h3 style="margin-top:25px;">Freight Charges</h3>
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="background:#1C5070; color:white;">
          <th style="${th}">Charge Name</th>
          <th style="${th}">Rate/KG</th>
          <th style="${th}">Weight</th>
          <th style="${th}">Amount (${quotation.currency || 'USD'})</th>
          <th style="${th}">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${freightRows}
        <tr style="background:#f1f1f1; font-weight:600;">
          <td style="${td}" colspan="4" align="right">Freight Total (${quotation.currency || 'USD'})</td>
          <td style="${td}">₹${formatAmount(totalINRFromCharges)}</td>
        </tr>
      </tbody>
    </table>

    <h3 style="margin-top:25px;">Destination & Clearance Charges</h3>
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="background:#1C5070; color:white;">
          <th style="${th}">Charge Name</th>
          <th style="${th}">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${destinationRows}
        ${clearanceRows}
        <tr style="background:#f1f1f1; font-weight:600;">
          <td style="${td}" align="right">Destination Total</td>
          <td style="${td}">₹${formatAmount(totalDestination)}</td>
        </tr>
        <tr style="background:#f1f1f1; font-weight:600;">
          <td style="${td}" align="right">Clearance Total</td>
          <td style="${td}">₹${formatAmount(totalClearance)}</td>
        </tr>
        <tr style="background:#e9f5ef; font-weight:700;">
          <td style="${td}" align="right">Destination + Clearance Total</td>
          <td style="${td}">₹${formatAmount(totalDestinationClearance)}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top:25px; text-align:right;">
      <p><strong>Subtotal (INR):</strong> ₹${formatAmount(subtotalINR)}</p>
      <p><strong>GST (18%):</strong> ₹${formatAmount(gst)}</p>
      <h3 style="color:#1f2937">Grand Total: <strong>₹${formatAmount(grandTotal)}</strong></h3>
    </div>

    <p style="text-align:center; margin-top:25px; color:#777;">
      Thank you for choosing <b>Multilogistics</b>.<br/>
      © ${new Date().getFullYear()} All Rights Reserved.
    </p>

  </div>
  `;

  await sendEmail({
    to: customerEmail,
    subject,
    html,
    attachments: [
      {
        filename: 'logo1.jpg',
        path: path.join(__dirname, '../utils/logo1.jpg'),
        cid: 'mllogo'
      }
    ]
  });
};

module.exports = { sendSeaQuotationMail };