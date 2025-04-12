# 🛡️ Safe Route Navigator

**Safe Route Navigator** is a smart, secure pathfinding application that uses real-time crime data and safety parameters to determine the safest routes between two locations. Built with React and Mapbox, this project aims to enhance personal safety while navigating cities, especially during night-time or in high-risk zones.

---

## 🚀 Features

- 🔒 **Safety-First Routing**: Calculates routes based on crime-rate data instead of just distance or time.
- 📍 **Multiple Route Options**: Presents multiple alternatives, highlighting safer paths.
- 🚨 **Emergency Corner**: Instantly send emergency alerts via EmailJS to pre-listed contacts.
- 📱 **Mobile Friendly**: Optimized for both desktop and mobile views.
- 🌐 **Real-Time Data Integration**: Uses public crime APIs or datasets to feed location-based statistics.

---

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Maps & Navigation**: Mapbox GL JS, Mapbox Directions API
- **Email Service**: EmailJS (for emergency alert feature)
- **Geospatial Computation**: Turf.js
- **Data Sources**: Public crime datasets / simulated JSON for development

---

## 🔧 Installation & Setup

```bash
git clone https://github.com/your-username/safe-route-navigator.git
cd safe-route-navigator
npm install
```

### Start the development server:

```bash
npm run dev
```


---

## 📂 Project Structure

```
src/
│
├── MapComponent.jsx
├── MapView.jsx
├── EmergencyCorner.jsx
├── RouteSelector.jsx
├── main.jsx
├── Login.jsx
├── SignUp.jsx
├── assets/
│   └── logo.png
│
└── App.jsx
```

---

## 🧰 How It Works

1. **User enters source and destination coordinates.**
2. **App fetches multiple routes** using Mapbox Directions API.
3. **Each route is scored** based on proximity to crime zones.
4. **Routes are ranked and displayed**, with the safest one highlighted.
5. **Optional emergency alert** can be triggered via EmergencyCorner.

---

## 📌 Future Enhancements

- Real-time location tracking
- Email alert integration
- User-contributed reports
---

