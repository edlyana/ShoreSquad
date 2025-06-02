// Main JavaScript file for ShoreSquad

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Initialize the map
    initMap();

    // Initialize weather with loading state
    const weatherContainer = document.querySelector('.weather-container');
    weatherContainer.classList.add('loading');
    
    // Initialize weather data and set up auto-refresh
    initWeather();
    setInterval(initWeather, 5 * 60 * 1000);

    // Add animation to stats when they come into view
    initStatsAnimation();
});

// Map initialization using OpenStreetMap with Leaflet
function initMap() {
    try {
        // Initialize map centered on Singapore
        const map = L.map('cleanup-map', {
            center: [1.3521, 103.8198],
            zoom: 12,
            zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Custom marker icon
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: '<i class="fas fa-hand-holding-water"></i>',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });

        // Add cleanup locations and markers
        const cleanupLocations = [
            {
                coords: [1.373, 103.949],
                name: "Pasir Ris Park Beach",
                date: formatCleanupDate(0),
                time: "9:00 AM - 12:00 PM",
                participants: 15,
                meetingPoint: "Meet at Pasir Ris Park Car Park D"
            },
            {
                coords: [1.300, 103.907],
                name: "East Coast Park Area E",
                date: formatCleanupDate(7),
                time: "8:00 AM - 11:00 AM",
                participants: 12,
                meetingPoint: "Meet at East Coast Lagoon Food Village"
            },
            {
                coords: [1.472, 103.841],
                name: "Sembawang Park Beach",
                date: formatCleanupDate(14),
                time: "4:00 PM - 6:00 PM",
                participants: 8,
                meetingPoint: "Meet at Sembawang Park Restaurant"
            }
        ];

        // Update next cleanup info
        const nextCleanup = cleanupLocations[0];
        if (document.getElementById('next-cleanup-info')) {
            document.getElementById('next-cleanup-info').innerHTML = `
                <p><i class="fas fa-map-marker-alt"></i> Next Cleanup: ${nextCleanup.name}</p>
                <p><i class="fas fa-calendar"></i> ${nextCleanup.date}</p>
                <p><i class="fas fa-clock"></i> ${nextCleanup.time}</p>
                <p><i class="fas fa-users"></i> ${nextCleanup.participants} volunteers registered</p>
                <p><i class="fas fa-info-circle"></i> ${nextCleanup.meetingPoint}</p>
            `;
        }

        // Add markers
        cleanupLocations.forEach(location => {
            const marker = L.marker(location.coords, { icon: customIcon }).addTo(map);
            marker.bindPopup(`
                <div class="map-popup">
                    <h3>${location.name}</h3>
                    <p><i class="fas fa-calendar"></i> ${location.date}</p>
                    <p><i class="fas fa-clock"></i> ${location.time}</p>
                    <p><i class="fas fa-users"></i> ${location.participants} volunteers registered</p>
                    <p><i class="fas fa-info-circle"></i> ${location.meetingPoint}</p>
                    <button onclick="getDirections(${location.coords[0]},${location.coords[1]})" class="directions-btn">
                        Get Directions
                    </button>
                </div>
            `);
        });

        // Add geolocation control
        L.control.locate({
            position: 'bottomright',
            flyTo: true,
            strings: { title: "Show my location" },
            locateOptions: { enableHighAccuracy: true }
        }).addTo(map);

    } catch (error) {
        console.error('Map initialization error:', error);
        document.querySelector('.map-container').innerHTML = 
            '<p class="error">Unable to load map. Please try again later.</p>';
    }
}

// Helper function to format the cleanup date
function formatCleanupDate(daysToAdd = 0) {
    const date = new Date();
    // Set to next Saturday + any additional days
    date.setDate(date.getDate() + (6 - date.getDay() + 7) % 7 + daysToAdd);
    return date.toLocaleDateString('en-SG', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
}

// Function to get directions to cleanup location
function getDirections(lat, lng) {
    // Open directions in a new tab using OpenStreetMap
    window.open(`https://www.openstreetmap.org/directions?from=&to=${lat},${lng}`, '_blank');
}

// Weather data initialization using NEA's API
async function initWeather() {
    const weatherContainer = document.querySelector('.weather-container');
    weatherContainer.classList.add('loading');

    try {        
        const date = new Date().toISOString().split('T')[0];
        
        // Fetch current weather conditions
        const currentResponse = await fetch(`https://api.data.gov.sg/v1/environment/air-temperature?date=${date}`);
        const currentData = await currentResponse.json();
        
        // Fetch humidity
        const humidityResponse = await fetch(`https://api.data.gov.sg/v1/environment/relative-humidity?date=${date}`);
        const humidityData = await humidityResponse.json();
        
        // Fetch wind speed
        const windResponse = await fetch(`https://api.data.gov.sg/v1/environment/wind-speed?date=${date}`);
        const windData = await windResponse.json();
        
        // Fetch UV index
        const uvResponse = await fetch(`https://api.data.gov.sg/v1/environment/uv-index?date=${date}`);
        const uvData = await uvResponse.json();
        
        // Fetch rainfall
        const rainResponse = await fetch(`https://api.data.gov.sg/v1/environment/rainfall?date=${date}`);
        const rainData = await rainResponse.json();
        
        // Fetch 4-day forecast
        const forecastResponse = await fetch(`https://api.data.gov.sg/v1/environment/4-day-weather-forecast?date=${date}`);
        const forecastData = await forecastResponse.json();

        // Update current conditions with all data
        updateCurrentWeather(currentData, humidityData, windData, uvData, rainData);
        
        // Update forecast
        updateForecast(forecastData);

        // Dispatch event to indicate weather update is complete
        const event = new Event('weatherUpdate');
        weatherContainer.dispatchEvent(event);

    } catch (error) {
        console.error('Error fetching weather data:', error);
        weatherContainer.innerHTML = '<p class="error">Unable to load weather data. Please try again later.</p>';
    } finally {
        // Always remove loading state, whether successful or not
        weatherContainer.classList.remove('loading');
    }
}

function updateCurrentWeather(tempData, humidityData, windData, uvData, rainData) {
    // Get latest readings
    const latestTemp = tempData.items[tempData.items.length - 1];
    const latestHumidity = humidityData.items[humidityData.items.length - 1];
    const latestWind = windData.items[windData.items.length - 1];
    const latestUV = uvData.items[uvData.items.length - 1];
    const latestRain = rainData.items[rainData.items.length - 1];

    // Update DOM elements
    document.getElementById('current-temp').innerHTML = `
        <i class="fas fa-thermometer-half"></i>
        <div>${latestTemp.readings[0].value.toFixed(1)}°C</div>
    `;
    
    document.getElementById('current-humidity').innerHTML = `
        <i class="fas fa-tint"></i>
        <div>${latestHumidity.readings[0].value.toFixed(0)}% Humidity</div>
    `;
    
    document.getElementById('current-wind').innerHTML = `
        <i class="fas fa-wind"></i>
        <div>${latestWind.readings[0].value.toFixed(1)} m/s</div>
    `;

    document.getElementById('current-uv').innerHTML = `
        <i class="fas fa-sun"></i>
        <div>UV Index: ${latestUV.index[0].value}</div>
    `;

    document.getElementById('current-rain').innerHTML = `
        <i class="fas fa-cloud-rain"></i>
        <div>${latestRain.readings[0].value.toFixed(1)} mm</div>
    `;

    // Update last update time
    document.getElementById('last-update').textContent = 
        new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });
    
    // Remove loading state
    document.querySelector('.weather-container').classList.remove('loading');
}

function updateForecast(forecastData) {
    const container = document.getElementById('forecast-container');
    const forecast = forecastData.items[0].forecasts;
    
    container.innerHTML = forecast.map(day => `
        <div class="forecast-card">
            <div class="date">${formatDate(day.date)}</div>
            <div class="weather-icon">${getWeatherIcon(day.forecast)}</div>
            <div class="temp">
                <span class="high">${day.temperature.high}°C</span> / 
                <span class="low">${day.temperature.low}°C</span>
            </div>
            <div class="description">${day.forecast}</div>
            <div class="humidity">Relative Humidity: ${day.relative_humidity.low}% - ${day.relative_humidity.high}%</div>
        </div>
    `).join('');
}

function getWeatherIcon(forecast) {
    // Map NEA forecast descriptions to Font Awesome icons
    const iconMap = {
        'Partly Cloudy': '<i class="fas fa-cloud-sun"></i>',
        'Cloudy': '<i class="fas fa-cloud"></i>',
        'Light Rain': '<i class="fas fa-cloud-rain"></i>',
        'Moderate Rain': '<i class="fas fa-cloud-showers-heavy"></i>',
        'Heavy Rain': '<i class="fas fa-cloud-showers-heavy"></i>',
        'Showers': '<i class="fas fa-cloud-rain"></i>',
        'Thundery Showers': '<i class="fas fa-bolt"></i>',
        'Fair': '<i class="fas fa-sun"></i>',
        'Sunny': '<i class="fas fa-sun"></i>',
        'Windy': '<i class="fas fa-wind"></i>'
    };

    // Default icon if no match is found
    return iconMap[forecast] || '<i class="fas fa-cloud"></i>';
}

function formatDate(dateString) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-SG', options);
}

// Stats animation when scrolling into view
function initStatsAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.stat-card').forEach(card => {
        observer.observe(card);
    });
}

// Header scroll behavior
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    const currentScroll = window.pageYOffset;

    if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
    }

    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        // Scroll down
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        // Scroll up
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});
