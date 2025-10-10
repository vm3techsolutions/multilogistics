
const { sendEmail } = require("../config/sendEmail");

/**
 * Send quotation email to customer and company
 * @param {string} customerEmail
 * @param {string} companyEmail
 * @param {object} quotation - { quote_no, subject, origin, destination, actual_weight, status, packages, charges }
 */
const sendQuotationMail = async (customerEmail, companyEmail, quotation) => {
  const subject = `Quotation ${quotation.quote_no} - ${quotation.status.toUpperCase()}`;
  const statusColor = quotation.status === "approved" ? "#28a745" : "#dc3545";
  const messageTitle =
    quotation.status === "approved"
      ? "Your quotation has been approved!"
      : "Your quotation has been rejected.";

  // Packages table HTML
  const packagesHtml = quotation.packages && quotation.packages.length > 0
    ? `<h3>Packages</h3>
       <table style="width:100%; border-collapse:collapse;">
         <tr style="background:#f1f1f1;">
           <th style="padding:8px; border:1px solid #ddd;">Length</th>
           <th style="padding:8px; border:1px solid #ddd;">Width</th>
           <th style="padding:8px; border:1px solid #ddd;">Height</th>
           <th style="padding:8px; border:1px solid #ddd;">Weight</th>
         </tr>
         ${quotation.packages.map(p => `
           <tr>
             <td style="padding:8px; border:1px solid #eee;">${p.length || 0}</td>
             <td style="padding:8px; border:1px solid #eee;">${p.width || 0}</td>
             <td style="padding:8px; border:1px solid #eee;">${p.height || 0}</td>
             <td style="padding:8px; border:1px solid #eee;">${p.weight || 0}</td>
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

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #ddd; border-radius:10px; padding:20px;">
      <h2 style="color:#003366;">Courier Export Quotation Update</h2>
      <p>${messageTitle}</p>
      <table style="width:100%; border-collapse:collapse; margin-top:20px;">
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Quotation No:</b></td><td style="padding:8px; border:1px solid #eee;">${quotation.quote_no}</td></tr>
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Subject:</b></td><td style="padding:8px; border:1px solid #eee;">${quotation.subject || "N/A"}</td></tr>
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Origin:</b></td><td style="padding:8px; border:1px solid #eee;">${quotation.origin || "N/A"}</td></tr>
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Destination:</b></td><td style="padding:8px; border:1px solid #eee;">${quotation.destination || "N/A"}</td></tr>
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Actual Weight:</b></td><td style="padding:8px; border:1px solid #eee;">${quotation.actual_weight || 0} kg</td></tr>
        <tr><td style="padding:8px; border:1px solid #eee;"><b>Status:</b></td><td style="padding:8px; border:1px solid #eee; color:${statusColor}; font-weight:bold;">${quotation.status.toUpperCase()}</td></tr>
      </table>
      ${packagesHtml}
      ${chargesHtml}
      <p style="margin-top:25px; font-size:14px; color:#555;">
        For further details, contact our support team.
      </p>
      <p style="margin-top:20px; font-size:14px; color:#777;">
        Thank you for choosing <b>Your Logistics Partner</b>.<br/>
        © ${new Date().getFullYear()} All Rights Reserved.
      </p>
    </div>
  `;

  await sendEmail({
    to: [customerEmail, companyEmail].filter(Boolean).join(","),
    subject,
    html: htmlContent,
  });
};

module.exports = { sendQuotationMail };
