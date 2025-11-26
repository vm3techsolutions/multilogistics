
const { sendEmail } = require("../config/sendEmail");

/**
 * Send quotation email to customer and company
 * @param {string} customerEmail
 * @param {string} companyEmail
 * @param {object} quotation - { quote_no, subject, origin, destination, actual_weight, packages, charges }
 */
const sendQuotationMail = async (customerEmail, companyEmail, quotation) => {
  const subject = `Quotation ${quotation.quote_no} - Ready for Approval`;
  const messageTitle = "Your quotation is ready, please approve!";

  // Packages table HTML
  const packagesHtml = quotation.packages && quotation.packages.length > 0
    ? `<h3>Packages</h3>
       <table style="width:100%; border-collapse:collapse;">
         <tr style="background:#f1f1f1;">
           <th style="padding:8px; border:1px solid #ddd;">Length</th>
           <th style="padding:8px; border:1px solid #ddd;">Width</th>
           <th style="padding:8px; border:1px solid #ddd;">Height</th>
           <th style="padding:8px; border:1px solid #ddd;">Same Size</th>
         </tr>
         ${quotation.packages.map(p => `
           <tr>
             <td style="padding:8px; border:1px solid #eee;">${p.length || 0}</td>
             <td style="padding:8px; border:1px solid #eee;">${p.width || 0}</td>
             <td style="padding:8px; border:1px solid #eee;">${p.height || 0}</td>
             <td style="padding:8px; border:1px solid #eee;">${p.same_size || 0}</td>
           </tr>
         `).join("")}
       </table>` : "";

  // Charges table HTML
  const chargesHtml = quotation.charges && quotation.charges.length > 0
    ? `<h3>Charges</h3>
       <table style="width:100%; border-collapse:collapse;">
         <tr style="background:#f1f1f1;">
           <th style="padding:8px; border:1px solid #ddd;">Charge Name</th>
           <th style="padding:8px; border:1px solid #ddd;">Type</th>
           <th style="padding:8px; border:1px solid #ddd;">Amount</th>
           <th style="padding:8px; border:1px solid #ddd;">Description</th>
         </tr>
         ${quotation.charges.map(c => `
           <tr>
             <td style="padding:8px; border:1px solid #eee;">${c.charge_name || ""}</td>
             <td style="padding:8px; border:1px solid #eee;">${c.type || ""}</td>
             <td style="padding:8px; border:1px solid #eee;">${c.amount || 0}</td>
             <td style="padding:8px; border:1px solid #eee;">${c.description || ""}</td>
           </tr>
         `).join("")}
       </table>` : "";

  const formatAmount = (v) => {
    if (v === null || v === undefined) return '0.00';
    const n = Number(v);
    return isNaN(n) ? String(v) : n.toFixed(2);
  };

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #ddd; border-radius:10px; padding:20px;">
      <h2 style="color:#003366;">Courier Export Quotation</h2>
      <p>${messageTitle}</p>
      <table style="width:100%; border-collapse:collapse; margin-top:20px;">
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Quotation No:</b></td><td style="padding:8px; border:1px solid #eee;">${quotation.quote_no}</td></tr>
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Subject:</b></td><td style="padding:8px; border:1px solid #eee;">${quotation.subject || "N/A"}</td></tr>
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Origin:</b></td><td style="padding:8px; border:1px solid #eee;">${quotation.origin || "N/A"}</td></tr>
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Destination:</b></td><td style="padding:8px; border:1px solid #eee;">${quotation.destination || "N/A"}</td></tr>
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Actual Weight:</b></td><td style="padding:8px; border:1px solid #eee;">${quotation.actual_weight || 0} kg</td></tr>
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Total (before GST):</b></td><td style="padding:8px; border:1px solid #eee;">${formatAmount(quotation.total)}</td></tr>
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Final Total (incl. GST):</b></td><td style="padding:8px; border:1px solid #eee;">${formatAmount(quotation.finalTotal)}</td></tr>
      </table>
      ${packagesHtml}
      ${chargesHtml}
      <p style="margin-top:25px; font-size:14px; color:#555;">
        Please review the quotation details and approve if everything looks correct.
      </p>
      <p style="margin-top:20px; font-size:14px; color:#777;">
        Thank you for choosing <b>Your Logistics Partner</b>.<br/>
        © ${new Date().getFullYear()} All Rights Reserved.
      </p>
    </div>
  `;

  await sendEmail({
    to: [customerEmail].filter(Boolean).join(","),
    subject,
    html: htmlContent,
  });
};

module.exports = { sendQuotationMail };
