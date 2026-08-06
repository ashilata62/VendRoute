const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 'some-user-id', role: 'SUPERADMIN' }, 'vendroute_super_secret_jwt_key_2026', { expiresIn: '1h' });

async function run() {
  const data = {
    "company": {
      "orgName": "Maryland Vending Service",
      "timezone": "Asia/Kolkata (IST, UTC+5:30)",
      "currency": "INR (₹)",
      "language": "English",
      "theme": "Light",
      "logo": ""
    },
    "routing": {
      "autoOptimize": true,
      "maxStops": 15,
      "startTime": "08:00",
      "endTime": "18:00",
      "priority": "Medium",
      "distanceLimit": 120,
      "shiftType": "Day Shift (08:00 - 17:00)",
      "breakTime": 60,
      "weekendSat": true,
      "weekendSun": true,
      "holidays": "New Year, Independence Day, Diwali"
    },
    "gps": {
      "gpsAccuracy": "High (GPS + Network)",
      "gpsInterval": 10,
      "geofenceRadius": 50,
      "backgroundTracking": true,
      "mandatoryCheckin": true,
      "maxPhotos": 4,
      "maxImageSize": 5,
      "compression": "80% (Optimized)",
      "allowedJPG": true,
      "allowedPNG": true,
      "allowedWEBP": true,
      "cloudProvider": "Firebase Storage"
    },
    "permissions": {
      "superadmin": {
        "regions": true,
        "users": true,
        "routes": true,
        "reports": true
      },
      "supervisor": {
        "regions": true,
        "users": false,
        "routes": true,
        "reports": true
      },
      "driver": {
        "regions": false,
        "users": false,
        "routes": false,
        "reports": false
      }
    },
    "machineTypes": [],
    "productCategories": [],
    "inventoryRules": {
      "minStock": 20,
      "maxStock": 100,
      "refillAlert": true
    },
    "attendanceRules": {
      "gracePeriod": 15,
      "halfDayLimit": 4,
      "geofenceCheckin": true
    },
    "apiForm": {
      "googleMapsKey": "",
      "twilioKey": "",
      "smsEnabled": false,
      "recipients": ""
    }
  };
  
  const res = await fetch('http://localhost:5000/api/v1/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  
  const json = await res.json();
  console.log('PUT Response:', json);
}

run();
