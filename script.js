// Elements
const cityInput = document.getElementById('cityInput');
const searchForm = document.getElementById('searchForm');
const weatherDisplay = document.getElementById('weatherDisplay');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const favoritesList = document.getElementById('favoritesList');
const addFavoriteBtn = document.getElementById('addFavoriteBtn');

// API Configuration
const API_KEY = '12b61c436fb04da08e8164812262101';
const API_BASE = 'https://api.weatherapi.com/v1';

// LocalStorage for Favorites
let favorites = JSON.parse(localStorage.getItem('weatherAppFavorites')) || [];
let currentCity = '';

// Event Listeners
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        await loadWeather(city);
    }
});

addFavoriteBtn.addEventListener('click', () => {
    if (currentCity) {
        toggleFavorite(currentCity);
    }
});

// Sidebar Navigation
document.querySelectorAll('.nav-item').forEach((item, index) => {
    item.addEventListener('click', () => {
        // Remove active class from all items
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        // Add active class to clicked item
        item.classList.add('active');

        // Handle navigation based on index
        if (index === 0) {
            // Weather - show main weather display
            weatherDisplay.style.display = 'grid';
        } else if (index === 1) {
            // Cities - could scroll to search or show a cities list
            cityInput.focus();
        } else if (index === 2) {
            // Favorites - focus on favorites section
            const favSection = document.querySelector('.favorites-inline');
            if (favSection) {
                favSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
});

// Map weather condition to Weather Icons
function getWeatherIcon(condition) {
    const text = condition.toLowerCase();

    // Day/Night detection would require checking is_day from API
    // For now, using day icons

    if (text.includes('sunny') || text.includes('clear')) return 'wi wi-day-sunny';
    if (text.includes('partly cloudy')) return 'wi wi-day-cloudy';
    if (text.includes('cloudy') || text.includes('overcast')) return 'wi wi-cloudy';
    if (text.includes('mist') || text.includes('fog')) return 'wi wi-fog';
    if (text.includes('rain') || text.includes('drizzle')) return 'wi wi-rain';
    if (text.includes('shower')) return 'wi wi-showers';
    if (text.includes('thunder') || text.includes('storm')) return 'wi wi-thunderstorm';
    if (text.includes('snow') || text.includes('sleet')) return 'wi wi-snow';
    if (text.includes('blizzard')) return 'wi wi-snow-wind';
    if (text.includes('wind')) return 'wi wi-strong-wind';
    if (text.includes('hail')) return 'wi wi-hail';

    // Default
    return 'wi wi-day-cloudy';
}

// Load Weather Data (Fetch API + Async/Await)
async function loadWeather(city) {
    try {
        loadingSpinner.classList.remove('hidden');
        weatherDisplay.classList.add('hidden');
        errorMessage.textContent = '';

        const response = await fetch(
            `${API_BASE}/forecast.json?key=${API_KEY}&q=${city}&days=7&aqi=no`
        );

        if (!response.ok) throw new Error('City not found');

        const data = await response.json();
        currentCity = data.location.name;
        renderWeather(data);
        renderForecast(data.forecast.forecastday);
        updateFavoriteButton();
        renderFavorites();

        loadingSpinner.classList.add('hidden');
        weatherDisplay.classList.remove('hidden');
    } catch (error) {
        loadingSpinner.classList.add('hidden');
        errorMessage.textContent = error.message || 'Failed to fetch weather';
    }
}

// Render Weather Data
function renderWeather(data) {
    const { name, country, localtime } = data.location;
    const {
        temp_c,
        condition,
        feelslike_c,
        wind_kph,
        pressure_mb,
        vis_km,
        uv
    } = data.current;

    // Get chance of rain from forecast
    const rainChance = data.forecast.forecastday[0].day.daily_chance_of_rain;

    // Update main elements
    document.getElementById('cityName').textContent = `${name}, ${country}`;
    document.getElementById('condition').textContent = condition.text;
    document.getElementById('temperature').textContent = `${Math.round(temp_c)}°C`;

    // Use Weather Icons instead of API image
    const iconElement = document.getElementById('weatherIcon');
    iconElement.className = getWeatherIcon(condition.text) + ' weather-icon-large';
    iconElement.removeAttribute('src');
    iconElement.removeAttribute('alt');

    // Format date
    const date = new Date(localtime);
    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    document.getElementById('dateTime').textContent = dateStr;

    // Update air conditions
    document.getElementById('feelsLike').textContent = `${Math.round(feelslike_c)}°`;
    document.getElementById('windSpeed').textContent = `${wind_kph} km/h`;
    document.getElementById('rainChance').textContent = `${rainChance}%`;
    document.getElementById('uvIndex').textContent = uv;
    document.getElementById('visibility').textContent = `${vis_km} km`;
    document.getElementById('pressure').textContent = `${pressure_mb} mb`;
}

// Render Forecast
function renderForecast(days) {
    const forecastDisplay = document.getElementById('forecastDisplay');

    // Use first 5 days
    const displayDays = days.slice(0, 5);

    forecastDisplay.innerHTML = displayDays.map(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const iconClass = getWeatherIcon(day.day.condition.text);

        return `
            <div class="forecast-item">
                <div class="forecast-day">${dayName}</div>
                <i class="${iconClass} forecast-icon"></i>
                <div class="forecast-temp">${Math.round(day.day.avgtemp_c)}°</div>
            </div>
        `;
    }).join('');
}

// Toggle Favorite
function toggleFavorite(city) {
    const index = favorites.findIndex(f => f.city.toLowerCase() === city.toLowerCase());

    if (index === -1) {
        favorites.push({ city });
    } else {
        favorites.splice(index, 1);
    }

    localStorage.setItem('weatherAppFavorites', JSON.stringify(favorites));
    updateFavoriteButton();
    renderFavorites();
}

// Update Favorite Button
function updateFavoriteButton() {
    const isFavorite = favorites.some(f => f.city.toLowerCase() === currentCity.toLowerCase());
    const btn = addFavoriteBtn;

    if (isFavorite) {
        btn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
    } else {
        btn.innerHTML = '<i class="fas fa-heart"></i> Add to Favorites';
    }
}

// Render Favorites List
function renderFavorites() {
    const noFavMsg = document.getElementById('noFavorites');

    if (favorites.length === 0) {
        favoritesList.innerHTML = '';
        noFavMsg.style.display = 'block';
    } else {
        noFavMsg.style.display = 'none';
        favoritesList.innerHTML = favorites.map(fav => `
            <button class="fav-item" onclick="loadWeather('${fav.city}')">
                ${fav.city}
                <i class="fas fa-map-marker-alt"></i>
            </button>
        `).join('');
    }
}

// Expose loadWeather globally
window.loadWeather = loadWeather;

// Initialize with a default city
loadWeather('Ahmedabad');
renderFavorites();
