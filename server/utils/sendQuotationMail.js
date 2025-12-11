
const { sendEmail } = require("../config/sendEmail");
const path = require("path");

// Format numbers safely
const formatAmount = (v) => {
  if (v === null || v === undefined) return "0.00";
  const n = Number(v);
  return isNaN(n) ? String(v) : n.toFixed(2);
};

const sendQuotationMail = async (customerEmail, quotation) => {
  const subject = `Quotation ${quotation.quote_no} - Ready for Approval`;

  const th = "padding:10px; text-align:center; border:1px solid #ddd;";
  const td = "padding:10px; text-align:center; border:1px solid #ddd;";

  // ---------------- PACKAGES ----------------
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
      .join("") || "";

  // ---------------- FREIGHT CHARGES ----------------
  const freightRows =
    quotation.charges
      ?.filter((c) => c.type === "freight")
      .map(
        (c) => `
      <tr>
        <td style="${td}">${c.charge_name}</td>
        <td style="${td}">${c.rate_per_kg || ""}</td>
        <td style="${td}">${c.weight_kg || ""}</td>
        <td style="${td}">₹${formatAmount(c.amount)}</td>
        <td style="${td}">₹${formatAmount(c.amount)}</td>
      </tr>`
      )
      .join("") || "";

  const totalFreight = quotation.charges
    ?.filter((c) => c.type === "freight")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

  // ---------------- DESTINATION CHARGES ----------------
  const destinationRows =
    quotation.charges
      ?.filter((c) => c.type === "destination")
      .map(
        (c) => `
      <tr>
        <td style="${td}">${c.charge_name}</td>
        <td style="${td}">₹${formatAmount(c.amount)}</td>
      </tr>`
      )
      .join("") || "";

  const totalDestination = quotation.charges
    ?.filter((c) => c.type === "destination")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

  // FINAL TOTAL
  const grandTotal = totalFreight + totalDestination;
  const gst = grandTotal * 0.18;

  // ---------------- EMAIL HTML ----------------

  const html = `
<div style="font-family: Arial; max-width:650px; margin:auto; border:1px solid #ddd; border-radius:12px; padding:20px; background:#ffffff">

  <!-- HEADER -->
  

  <h2 style="text-align:center; color:#003366; margin-top:20px;">Courier Export Quotation</h2>
  <p style="text-align:center; color:#444;">Your quotation is ready. Please review and approve.</p>

<!-- HEADER (Gmail Safe) -->
<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #e5e7eb; margin-bottom:10px;">
  <tr>
    <td width="40%" style="padding:10px;">
      <img src="cid:mllogo" alt="Logo" style="height:80px; display:block;" />
    </td>

    <td width="60%" style="text-align:right; font-size:14px; color:#333; padding:10px;">
      <p><strong>Quotation No:</strong> ${quotation.quote_no}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-GB")}</p>
      <p><strong>Email:</strong> info@multilogistics.co.in</p>
      <p><strong>Phone:</strong> +91 8411007077</p>
    </td>
  </tr>
</table>



  <!-- CUSTOMER + SHIPMENT DETAILS -->
  <div style="display:flex; gap:15px; margin-top:20px;">

    <div style="width:50%; background:#f9fafb; padding:12px; border-radius:10px; border:1px solid #e5e7eb;">
      <h3>Customer Details</h3>
      <p><strong>Name:</strong> ${quotation.customer_name}</p>
      <p><strong>Email:</strong> ${quotation.customer_email}</p>
      <p><strong>Phone:</strong> ${quotation.customer_phone}</p>
      <p><strong>Address:</strong> ${quotation.address}</p>
    </div>

    <div style="width:50%; background:#f9fafb; padding:12px; border-radius:10px; border:1px solid #e5e7eb;">
      <h3>Shipment Details</h3>
      <p><strong>Origin:</strong> ${quotation.origin}</p>
      <p><strong>Destination:</strong> ${quotation.destination}</p>
      <p><strong>Packages:</strong> ${quotation.packages?.length || 0}</p>
    </div>

  </div>

  <!-- PACKAGES TABLE -->
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

  <!-- FREIGHT -->
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
        <td style="${td}" colspan="3" align="right">Freight Total</td>
        <td style="${td}">₹${formatAmount(totalFreight)}</td>
        <td style="${td}">₹${formatAmount(totalFreight)}</td>
      </tr>
    </tbody>
  </table>

  <!-- DESTINATION -->
  <h3 style="margin-top:25px;">Destination Charges</h3>
  <table style="width:100%; border-collapse:collapse;">
    <thead>
      <tr style="background:#1C5070; color:white;">
        <th style="${th}">Charge Name</th>
        <th style="${th}">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${destinationRows}
      <tr style="background:#f1f1f1; font-weight:600;">
        <td style="${td}" align="right">Destination Total</td>
        <td style="${td}">₹${formatAmount(totalDestination)}</td>
      </tr>
    </tbody>
  </table>

  <!-- TOTAL -->
  <div style="margin-top:25px;">
    <p><strong>Final Total:</strong> ₹${formatAmount(grandTotal)}</p>
    <p><strong>GST (18%):</strong> ₹${formatAmount(gst)}</p>
    <h3 style="color:#1f2937">Grand Total: <strong>₹${formatAmount(quotation.finalTotal)}</strong></h3>
  </div>

  <p style="text-align:center; margin-top:25px; color:#777;">
    Thank you for choosing <b>Your Logistics Partner</b>.<br/>
    © ${new Date().getFullYear()} All Rights Reserved.
  </p>

</div>
`;

  // 🚀 SEND WITH EMBEDDED LOGO (CID)
  await sendEmail({
    to: customerEmail,
    subject,
    html,
    attachments: [
      {
        filename: "logo1.jpg",
        path: path.join(__dirname, "../utils/logo1.jpg"),
        cid: "mllogo",
      },
    ],
  });
};

module.exports = { sendQuotationMail };
