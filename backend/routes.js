const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'safeher_ai_jwt_secret_key_12345';

// Configure Multer for Audio Recordings
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'recording-' + uniqueSuffix + path.extname(file.originalname || '.m4a'));
  }
});
const upload = multer({ storage: storage });

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalid or expired' });
    req.user = user;
    next();
  });
}

// ----------------- AUTHENTICATION -----------------

// Register User
router.post('/auth/register', async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUsers = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.query(
      'INSERT INTO Users (full_name, email, phone, password) VALUES (?, ?, ?, ?)',
      [full_name, email, phone, hashedPassword]
    );

    const userId = result.insertId;

    // Generate token
    const token = jwt.sign({ user_id: userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { user_id: userId, full_name, email, phone }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login User
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const users = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { user_id: user.user_id, full_name: user.full_name, email: user.email, phone: user.phone }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Profile
router.get('/auth/profile', authenticateToken, async (req, res) => {
  try {
    const users = await db.query('SELECT user_id, full_name, email, phone, created_at FROM Users WHERE user_id = ?', [req.user.user_id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------- TRUSTED CONTACTS -----------------

// Get Trusted Contacts
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const contacts = await db.query(
      'SELECT contact_id, contact_name, phone_number, relationship FROM Trusted_Contacts WHERE user_id = ?',
      [req.user.user_id]
    );
    res.json(contacts);
  } catch (err) {
    console.error('Get contacts error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add Trusted Contact
router.post('/contacts', authenticateToken, async (req, res) => {
  try {
    const { contact_name, phone_number, relationship } = req.body;
    if (!contact_name || !phone_number) {
      return res.status(400).json({ error: 'Name and phone number are required' });
    }

    const result = await db.query(
      'INSERT INTO Trusted_Contacts (user_id, contact_name, phone_number, relationship) VALUES (?, ?, ?, ?)',
      [req.user.user_id, contact_name, phone_number, relationship || 'Friend']
    );

    res.status(201).json({
      message: 'Contact added successfully',
      contact: {
        contact_id: result.insertId,
        contact_name,
        phone_number,
        relationship
      }
    });
  } catch (err) {
    console.error('Add contact error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Trusted Contact
router.delete('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const contactId = req.params.id;
    const result = await db.query(
      'DELETE FROM Trusted_Contacts WHERE contact_id = ? AND user_id = ?',
      [contactId, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contact not found or unauthorized' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    console.error('Delete contact error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------- EMERGENCY ALERTS -----------------

// Create Emergency Alert
router.post('/alerts', authenticateToken, async (req, res) => {
  try {
    const { gps_coordinates, alert_status, trigger_type } = req.body; // e.g. "SOS_BUTTON" or "SHAKE"
    if (!gps_coordinates) {
      return res.status(400).json({ error: 'GPS coordinates are required' });
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    // Insert alert
    const result = await db.query(
      'INSERT INTO Emergency_Alerts (user_id, date, time, gps_coordinates, alert_status) VALUES (?, ?, ?, ?, ?)',
      [req.user.user_id, dateStr, timeStr, gps_coordinates, alert_status || 'Active']
    );

    // Fetch user details for notification
    const users = await db.query('SELECT full_name FROM Users WHERE user_id = ?', [req.user.user_id]);
    const userName = users[0] ? users[0].full_name : 'A SafeHer User';

    // Fetch trusted contacts
    const contacts = await db.query('SELECT contact_name, phone_number FROM Trusted_Contacts WHERE user_id = ?', [req.user.user_id]);

    // Simulate sending SMS alerts
    const smsLogs = contacts.map(c => ({
      contact: c.contact_name,
      phone: c.phone_number,
      message: `EMERGENCY! ${userName} is in danger! Live Location: https://maps.google.com/?q=${gps_coordinates} (Triggered via ${trigger_type || 'SOS'})`
    }));

    console.log('--- EMERGENCY ALERT LOG ---');
    console.log(`Alert ID: ${result.insertId}`);
    console.log(`User: ${userName}`);
    console.log(`GPS: ${gps_coordinates}`);
    console.log(`Trigger: ${trigger_type}`);
    console.log('Simulated SMS Broadcasts:', JSON.stringify(smsLogs, null, 2));
    if (trigger_type === 'SHAKE') {
      console.log(`[SIMULATION] Alerting closest Police Station. Dispatching patrol car to coordinates: ${gps_coordinates}. Dialing 100/112.`);
    }
    console.log('---------------------------');

    res.status(201).json({
      message: 'Emergency alert logged and broadcast simulation initiated',
      alert_id: result.insertId,
      time: timeStr,
      sms_broadcasts: smsLogs,
      police_alerted: trigger_type === 'SHAKE'
    });
  } catch (err) {
    console.error('Log alert error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------- AUDIO RECORDINGS -----------------

// Upload Recording
router.post('/recordings', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const relativePath = `uploads/${req.file.filename}`;

    // Save metadata
    const result = await db.query(
      'INSERT INTO Audio_Recordings (user_id, recording_file_path) VALUES (?, ?)',
      [req.user.user_id, relativePath]
    );

    res.status(201).json({
      message: 'Audio recording saved successfully',
      recording_id: result.insertId,
      file_path: relativePath
    });
  } catch (err) {
    console.error('Save recording error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Recordings
router.get('/recordings', authenticateToken, async (req, res) => {
  try {
    const recordings = await db.query(
      'SELECT recording_id, recording_file_path, timestamp FROM Audio_Recordings WHERE user_id = ? ORDER BY timestamp DESC',
      [req.user.user_id]
    );
    res.json(recordings);
  } catch (err) {
    console.error('Get recordings error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------- AI ROUTE ANALYSIS -----------------

// AI Safe Route Scorer (Gemini + Local Heuristics Fallback)
router.post('/routes/analyze', authenticateToken, async (req, res) => {
  try {
    const { source, destination } = req.body;
    if (!source || !destination) {
      return res.status(400).json({ error: 'Source and destination are required' });
    }

    // 1. Generate 3 mock routes between source & destination
    // For a hackathon prototype, we simulate routes Route A, Route B, Route C
    const mockRoutes = [
      {
        id: 'route_a',
        name: 'Route A (Via Main Arterial Rd)',
        distance: '6.4 km',
        duration: '12 mins',
        lighting: 'High (LED Streetlights)',
        traffic: 'Moderate-High',
        police_stations: 1,
        hospitals: 2,
        open_shops: 5,
        reported_incidents: 'None in last 6 months',
        description: 'Follows major well-lit commercial streets with high camera coverage and 24x7 shop presence.'
      },
      {
        id: 'route_b',
        name: 'Route B (Shortest Cut - Residential lanes)',
        distance: '4.8 km',
        duration: '10 mins',
        lighting: 'Low (Dim/Broken lights)',
        traffic: 'Very Low',
        police_stations: 0,
        hospitals: 0,
        open_shops: 0,
        reported_incidents: 'Recent night robbery report',
        description: 'Shortest path, but passes through narrow residential alleys, dim streetlighting, and very low vehicle traffic.'
      },
      {
        id: 'route_c',
        name: 'Route C (Via Outer Ring Road)',
        distance: '8.2 km',
        duration: '16 mins',
        lighting: 'High (Highway Lit)',
        traffic: 'Heavy (Trucks/Fast cars)',
        police_stations: 0,
        hospitals: 1,
        open_shops: 2,
        reported_incidents: 'None',
        description: 'Longer highway route, busy with trucks and highway traffic. Safe but has longer isolated walking stretches at highway exits.'
      }
    ];

    let geminiUsed = false;
    let analyzedRoutes = [];

    // 2. Try to analyze using Gemini AI
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
          You are an AI-powered safety routing engine for a women's safety application called SafeHer AI.
          Analyze these three potential travel routes from "${source}" to "${destination}":
          
          ${JSON.stringify(mockRoutes, null, 2)}
          
          For each route, evaluate its safety and calculate a safety score out of 100 based on these safety weights:
          - Lighting (30%): High lighting gets max score, low/broken lighting gets penalty.
          - Traffic/Pedestrians (25%): Heavy/moderate traffic is safer (eyes on the street) than very low traffic.
          - Proximity to Emergency Services (20%): Points for nearby Police Stations and Hospitals.
          - Proximity to Safe Havens (15%): Points for 24x7 shops, petrol pumps, open pharmacies.
          - Criminal History (10%): Deduct points for recent reported incidents.
          
          Respond ONLY with a valid JSON array of objects (do not include markdown code block formatting or backticks, just raw JSON).
          Each object in the array MUST contain exactly these fields:
          - "route_id": string (must match the input route id)
          - "route_name": string
          - "distance": string
          - "duration": string
          - "safety_score": integer (0 to 100)
          - "safety_rating": string (e.g. "Excellent", "Safe", "Caution Required", "Unsafe")
          - "reasons": array of strings (explaining the score)
          - "nearby_assets": array of objects, where each object has "name" (string), "type" (string: 'police'|'hospital'|'shop'|'pharmacy'|'petrol')
          - "recommendation_text": string (brief safety advice for this specific route)
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Clean the response from markdown block formatting if present
        const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        analyzedRoutes = JSON.parse(jsonText);
        geminiUsed = true;
        console.log('Route analysis successfully generated via Gemini API.');
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to local scoring:', geminiErr.message);
      }
    }

    // 3. Fallback Heuristics Model (Runs if Gemini fails or is not configured)
    if (!geminiUsed) {
      analyzedRoutes = mockRoutes.map(route => {
        let score = 50; // base score

        // Lighting score impact
        if (route.lighting.includes('High')) score += 25;
        if (route.lighting.includes('Low')) score -= 15;

        // Traffic impact
        if (route.traffic.includes('High') || route.traffic.includes('Moderate')) score += 20;
        if (route.traffic.includes('Very Low')) score -= 10;

        // Assets impact
        score += (route.police_stations * 10);
        score += (route.hospitals * 5);
        score += Math.min(route.open_shops * 2, 10);

        // Incidents impact
        if (route.reported_incidents.includes('robbery') || route.reported_incidents.includes('unsafe')) {
          score -= 25;
        }

        // Bound between 0 and 100
        score = Math.max(0, Math.min(100, score));

        // Determine safety rating
        let rating = 'Caution Required';
        if (score >= 85) rating = 'Excellent';
        else if (score >= 70) rating = 'Safe';
        else if (score < 40) rating = 'Unsafe';

        // Custom assets array
        const assets = [];
        if (route.police_stations > 0) {
          assets.push({ name: 'Local Police Post', type: 'police' });
        }
        if (route.hospitals > 0) {
          assets.push({ name: 'Apex Hospital & ER', type: 'hospital' });
        }
        if (route.id === 'route_a') {
          assets.push({ name: '24/7 Pharmacy', type: 'pharmacy' });
          assets.push({ name: 'Shell Petrol Pump', type: 'petrol' });
        }

        // Construct reasons
        const reasons = [];
        if (score >= 70) {
          reasons.push('High density of public activity and street lighting.');
          if (route.police_stations > 0) reasons.push('Police visibility nearby.');
        } else {
          reasons.push('Low public presence or isolated stretches.');
          if (route.reported_incidents !== 'None') reasons.push('History of security concerns.');
        }

        return {
          route_id: route.id,
          route_name: route.name,
          distance: route.distance,
          duration: route.duration,
          safety_score: score,
          safety_rating: rating,
          reasons,
          nearby_assets: assets,
          recommendation_text: score >= 75
            ? 'Highly recommended path. Safe to travel even during nighttime hours.'
            : 'Caution advised. Avoid this route if traveling alone at night.'
        };
      });
      console.log('Route analysis generated via Local Heuristics engine.');
    }

    // Save the recommended (safest) route to Route_History table
    const safestRoute = analyzedRoutes.reduce((prev, current) => (prev.safety_score > current.safety_score) ? prev : current);
    await db.query(
      'INSERT INTO Route_History (user_id, source, destination, distance, safety_score) VALUES (?, ?, ?, ?, ?)',
      [req.user.user_id, source, destination, safestRoute.distance, safestRoute.safety_score]
    );

    res.json({
      source,
      destination,
      gemini_utilized: geminiUsed,
      routes: analyzedRoutes
    });
  } catch (err) {
    console.error('Route analysis error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Route History
router.get('/routes/history', authenticateToken, async (req, res) => {
  try {
    const history = await db.query(
      'SELECT route_id, source, destination, distance, safety_score, created_at FROM Route_History WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.user_id]
    );
    res.json(history);
  } catch (err) {
    console.error('Get route history error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
