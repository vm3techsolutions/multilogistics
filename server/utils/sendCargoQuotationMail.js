const { sendEmail } = require('../config/sendEmail');
const path = require('path');

// Format numbers safely
const formatAmount = (v) => {
  if (v === null || v === undefined) return '0.00';
  const n = Number(v);
  return isNaN(n) ? String(v) : n.toFixed(2);
};

const sendCargoQuotationMail = async (customerEmail, quotation) => {
  const subject = `Cargo Quotation ${quotation.quote_no} - Ready for Approval`;

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
  const baseFreight = freightCharges
    .filter((c) => c.charge_name !== 'CCF')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const ccfCharge = freightCharges.find((c) => c.charge_name === 'CCF');
  const ccfAmount = Number(ccfCharge?.amount || 0);

  const freightTotal = baseFreight + ccfAmount;

  const freightRows = freightCharges
    .map((c) => `
    <tr>
      <td style="${td}">${c.charge_name}</td>
      <td style="${td}">${c.rate_per_kg || ''}</td>
      <td style="${td}">${c.weight_kg || ''}</td>
      <td style="${td}">₹${formatAmount(c.amount)}</td>
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

  // Clearance charges (added)
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

  const subtotal = Number(quotation.total || 0);
  const gst = subtotal * 0.18;
  const grandTotal = Number(quotation.final_total || 0);

  const html = `
  <div style="font-family: Arial; max-width:650px; margin:auto; border:1px solid #ddd; border-radius:12px; padding:20px; background:#ffffff">

    <h2 style="text-align:center; color:#003366; margin-top:20px;">Cargo Export Quotation</h2>
    <p style="text-align:center; color:#444;">Your cargo quotation is ready. Please review and approve.</p>

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
          <th style="${th}">Amount</th>
          <th style="${th}">Total</th>
        </tr>
      </thead>
      <tbody>
        ${freightRows}
        <tr style="background:#f1f1f1; font-weight:600;">
          <td style="${td}" colspan="4" align="right">Freight Total</td>
          <td style="${td}">₹${formatAmount(freightTotal)}</td>
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
      <p><strong>Subtotal:</strong> ₹${formatAmount(subtotal)}</p>
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

module.exports = { sendCargoQuotationMail };