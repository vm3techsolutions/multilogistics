const db = require("../../config/db");

// Get shipment stats
const getCourierStats = async (req, res) => {
  try {
    // Total shipments
    const totalShipmentsRes = await db.query(
      `SELECT COUNT(*) AS total FROM courier_exports`
    );

    // Active shipments (example: shipments with delivery not completed yet)
    const activeShipmentsRes = await db.query(
      `SELECT COUNT(*) AS active 
       FROM courier_exports 
       WHERE place_of_delivery IS NULL OR place_of_delivery = ''`
    );

    // Average delivery time (difference between booking_date & updated_at)
    const avgDeliveryRes = await db.query(
      `SELECT ROUND(EXTRACT(EPOCH FROM (updated_at - booking_date)) / 86400) AS avg_delivery_days
   FROM courier_exports
   WHERE updated_at IS NOT NULL`
    );

    res.json({
      totalShipments: parseInt(totalShipmentsRes.rows[0].total, 10),
      activeShipments: parseInt(activeShipmentsRes.rows[0].active, 10),
      avgDeliveryTime:
        parseFloat(avgDeliveryRes.rows[0].avg_delivery_days) || 0,
    });
  } catch (err) {
    console.error("Get Courier Stats Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getCourierStats,
};
