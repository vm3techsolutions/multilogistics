const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// ================== AUTH FUNCTION ==================
const authFedex = async () => {
	try {
		const params = new URLSearchParams();
		params.append('grant_type', 'client_credentials');
		params.append('client_id', process.env.FEDEX_API_KEY);
		params.append('client_secret', process.env.FEDEX_SECRET_KEY);

		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
		};

		const response = await axios.post(
			`${process.env.FEDEX_BASE_API_URL}/oauth/token`,
			params,
			{ headers }
		);

		return response.data; // { access_token, token_type, expires_in }
	} catch (error) {
		console.error('❌ FedEx Auth Error:', error.response?.data || error.message);
		throw new Error('Failed to authenticate with FedEx');
	}
};

// ================== TRACKING FUNCTION ==================
const trackFedexShipment = async (req, res) => {
	try {
		const { trackingNumber } = req.params; // dynamic tracking number
		const authRes = await authFedex();

		const inputPayload = {
			includeDetailedScans: true,
			trackingInfo: [
				{
					trackingNumberInfo: {
						trackingNumber,
					},
				},
			],
		};

		const headers = {
			'Content-Type': 'application/json',
			'X-locale': 'en_US',
			Authorization: `Bearer ${authRes.access_token}`,
		};

		const response = await axios.post(
			`${process.env.FEDEX_BASE_API_URL}/track/v1/trackingnumbers`,
			inputPayload,
			{ headers }
		);

		const trackResult = response.data.output.completeTrackResults[0].trackResults[0];

		const trackingDetails = {
			trackingNumber: trackResult.trackingNumber,
			status: trackResult.latestStatusDetail?.description || 'Unknown',
			lastUpdate: trackResult.scanEvents?.[0]?.date || 'Unknown',
			location: trackResult.scanEvents?.[0]?.scanLocation?.city || 'Not Available',
			estimatedDelivery: trackResult.estimatedDeliveryTimeWindow?.window || 'N/A',
			events: trackResult.scanEvents?.map((ev) => ({
				description: ev.eventDescription,
				date: ev.date,
				city: ev.scanLocation?.city || 'Unknown',
				country: ev.scanLocation?.countryCode || 'Unknown',
			})),
		};

		res.json(trackingDetails);
	} catch (error) {
		console.error('❌ FedEx Tracking Error:', error.response?.data || error.message);
		res.status(500).json({ error: 'Failed to track FedEx shipment' });
	}
};

module.exports = { trackFedexShipment };

