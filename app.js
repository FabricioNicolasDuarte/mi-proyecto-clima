// Variables globales
let currentCity = "Buenos Aires";
let currentCountry = "Argentina";
let currentLat = -34.6037;  // Coordenadas iniciales para Buenos Aires
let currentLon = -58.3816;
const apiKey = "d26ed084c3d83a352c7df45505796b4d"; // Tu clave API

// Función para inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar la sección de clima y ocultar el mapa inicialmente
    document.getElementById('weatherDashboard').classList.remove('hidden');
    document.getElementById('mapSection').style.display = 'none';
    
    // Cargar datos iniciales
    getWeatherData(currentLat, currentLon);
    
    // Configurar eventos
    setupEventListeners();
});

// Configurar todos los event listeners
function setupEventListeners() {
    // Evento para el botón de búsqueda
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            const searchInput = document.getElementById('locationInput');
            if (searchInput && searchInput.value.trim() !== '') {
                searchLocation(searchInput.value);
            }
        });
    }
    
    // Evento para el botón de actualizar
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            getWeatherData(currentLat, currentLon);
        });
    }
    
    // Evento para el botón de reintento en caso de error
    const retryButton = document.getElementById('retryButton');
    if (retryButton) {
        retryButton.addEventListener('click', function() {
            getWeatherData(currentLat, currentLon);
        });
    }
    
    // Eventos para la navegación
    const homeLink = document.getElementById('homeLink');
    const mapLink = document.getElementById('mapLink');
    
    if (homeLink) {
        homeLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('weatherDashboard').style.display = 'grid';
            document.getElementById('mapSection').style.display = 'none';
            
            // Actualizar clases activas
            homeLink.classList.add('nav__link--active');
            mapLink.classList.remove('nav__link--active');
        });
    }
    
    if (mapLink) {
        mapLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('weatherDashboard').style.display = 'none';
            document.getElementById('mapSection').style.display = 'block';
            
            // Actualizar clases activas
            mapLink.classList.add('nav__link--active');
            homeLink.classList.remove('nav__link--active');
            
            // Inicializar mapa si no se ha hecho ya
            initMap();
        });
    }
    
    // Eventos para las ciudades listadas
    const locationItems = document.querySelectorAll('.location-list__item');
    locationItems.forEach(item => {
        item.addEventListener('click', function() {
            // Actualizar clases activas
            document.querySelectorAll('.location-list__item').forEach(i => {
                i.classList.remove('location-list__item--active');
            });
            this.classList.add('location-list__item--active');
            
            // Obtener nombre de ciudad y país
            const cityName = this.querySelector('.location-list__city').textContent;
            const countryName = this.querySelector('.location-list__country').textContent;
            
            currentCity = cityName;
            currentCountry = countryName;
            
            // Obtener coordenadas y actualizar el clima
            getCoordinates(cityName, countryName);
        });
    });
}

// Función para buscar ubicación
function searchLocation(query) {
    // Mostrar indicador de carga
    showLoading();
    
    // Primero obtenemos las coordenadas de la ciudad
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=metric&lang=es`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ciudad no encontrada');
            }
            return response.json();
        })
        .then(data => {
            // Actualizar variables globales
            currentCity = data.name;
            currentCountry = data.sys.country;
            currentLat = data.coord.lat;
            currentLon = data.coord.lon;
            
            // Ahora obtenemos los datos detallados
            return getWeatherData(currentLat, currentLon);
        })
        .catch(error => {
            console.error('Error:', error);
            showError('No se pudo encontrar la ciudad. Intenta con otra ubicación.');
            hideLoading();
        });
}

// Función para obtener coordenadas de una ciudad
function getCoordinates(city, country) {
    // Mostrar indicador de carga
    showLoading();
    
    // Construir la consulta (con o sin país)
    const query = country ? `${city},${country}` : city;
    
    // Llamada a la API Geocoding para obtener coordenadas
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener coordenadas');
            }
            return response.json();
        })
        .then(data => {
            currentLat = data.coord.lat;
            currentLon = data.coord.lon;
            
            // Ahora obtenemos los datos del clima con las coordenadas
            getWeatherData(currentLat, currentLon);
        })
        .catch(error => {
            console.error('Error:', error);
            showError('No se pudieron obtener las coordenadas. Intenta más tarde.');
            hideLoading();
        });
}

// Función para obtener datos del clima usando One Call API
function getWeatherData(lat, lon) {
    // Mostrar indicador de carga y ocultar error
    showLoading();
    document.getElementById('errorState').classList.add('hidden');
    
    // Llamada a la API One Call (versión 2.5, no 3.0)
    fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es&exclude=minutely,hourly`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener datos meteorológicos');
            }
            return response.json();
        })
        .then(data => {
            // Ocultar estados de carga y error, mostrar dashboard
            hideLoading();
            document.getElementById('loadingState').classList.add('hidden');
            document.getElementById('weatherDashboard').classList.remove('hidden');
            
            // Actualizar la interfaz con los datos
            updateWeatherUI(data);
            updateForecast(data.daily);
            
            // Actualizar la hora de actualización
            updateTimestamp();
        })
        .catch(error => {
            console.error('Error:', error);
            hideLoading();
            document.getElementById('loadingState').classList.add('hidden');
            document.getElementById('errorState').classList.remove('hidden');
        });
}

// Función para actualizar la interfaz con los datos meteorológicos
function updateWeatherUI(data) {
    // Actualizar ubicación
    document.getElementById('locationName').textContent = `${currentCity}, ${currentCountry}`;
    
    // Los datos actuales están en data.current
    const current = data.current;
    
    // Actualizar descripción del clima
    if (current.weather && current.weather[0]) {
        document.getElementById('weatherDescription').textContent = current.weather[0].description;
        
        // Actualizar ícono del clima
        updateWeatherIcon(current.weather[0].id);
    }
    
    // Actualizar temperatura principal
    document.getElementById('currentTemp').textContent = `${Math.round(current.temp)}°C`;
    
    // Actualizar sensación térmica
    document.getElementById('feelsLike').textContent = `${Math.round(current.feels_like)}°C`;
    
    // Actualizar humedad
    document.getElementById('humidity').textContent = `${current.humidity}%`;
    
    // Actualizar viento
    document.getElementById('windSpeed').textContent = `${Math.round(current.wind_speed * 3.6)} km/h`; // Convertir m/s a km/h
    
    // Actualizar presión
    document.getElementById('pressure').textContent = `${current.pressure} hPa`;
}

// Función para actualizar el pronóstico
function updateForecast(dailyData) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';
    
    // Obtener los próximos 5 días
    const nextFiveDays = dailyData.slice(1, 6);
    
    // Nombres de los días de la semana
    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Crear tarjetas de pronóstico
    nextFiveDays.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = weekdays[date.getDay()];
        const iconClass = getWeatherIconClass(day.weather[0].id);
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="forecast-card__day">${dayName}</div>
            <div class="forecast-card__icon ${iconClass}"></div>
            <div class="forecast-card__temp">
                <span class="forecast-card__temp-max">${Math.round(day.temp.max)}°</span>
                <span class="forecast-card__temp-min">${Math.round(day.temp.min)}°</span>
            </div>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}

// Función para actualizar el ícono del clima
function updateWeatherIcon(weatherId) {
    const weatherIcon = document.getElementById('weatherIcon');
    if (weatherIcon) {
        // Limpiar clases anteriores
        weatherIcon.className = 'weather-card__icon';
        
        // Añadir la clase adecuada según el ID del clima
        weatherIcon.classList.add(getWeatherIconClass(weatherId));
    }
}

// Función para obtener la clase de ícono según el ID del clima
function getWeatherIconClass(weatherId) {
    // Códigos de OpenWeatherMap: https://openweathermap.org/weather-conditions
    if (weatherId >= 200 && weatherId < 300) {
        return 'icon-stormy'; // Tormenta
    } else if (weatherId >= 300 && weatherId < 600) {
        return 'icon-rainy';  // Lluvia
    } else if (weatherId >= 600 && weatherId < 700) {
        return 'icon-snowy';  // Nieve
    } else if (weatherId >= 700 && weatherId < 800) {
        return 'icon-cloudy'; // Atmósfera (niebla, etc.)
    } else if (weatherId === 800) {
        return 'icon-sunny';  // Despejado
    } else if (weatherId > 800) {
        return 'icon-cloudy'; // Nubes
    }
    
    return 'icon-cloudy'; // Por defecto
}

// Función para mostrar indicador de carga
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
}

// Función para ocultar indicador de carga
function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
}

// Función para mostrar mensajes de error
function showError(message) {
    const errorMessage = document.querySelector('.error__message');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    document.getElementById('errorState').classList.remove('hidden');
}

// Función para actualizar la hora de actualización
function updateTimestamp() {
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        lastUpdate.textContent = `Actualizado: ${hours}:${minutes}`;
    }
}

// Función para inicializar el mapa
function initMap() {
    // Comprobar si el mapa ya está inicializado
    if (window.weatherMap) return;
    
    // Inicializar el mapa de Leaflet
    const map = L.map('weatherMap').setView([currentLat, currentLon], 5);
    
    // Añadir capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Guardar referencia al mapa
    window.weatherMap = map;
    
    // Añadir capa meteorológica
    updateWeatherLayer('temp');
    
    // Configurar eventos para controles del mapa
    const layerSelect = document.getElementById('mapLayerSelect');
    if (layerSelect) {
        layerSelect.addEventListener('change', function() {
            updateWeatherLayer(this.value);
        });
    }
    
    const zoomSelect = document.getElementById('mapZoomSelect');
    if (zoomSelect) {
        zoomSelect.addEventListener('change', function() {
            map.setZoom(parseInt(this.value));
        });
    }
}

// Función para actualizar la capa meteorológica del mapa
function updateWeatherLayer(layerType) {
    const map = window.weatherMap;
    if (!map) return;
    
    // Eliminar capa anterior si existe
    if (window.weatherLayer) {
        map.removeLayer(window.weatherLayer);
    }
    
    // Añadir nueva capa según el tipo seleccionado
    const weatherLayer = L.tileLayer(`https://tile.openweathermap.org/map/${layerType}/{z}/{x}/{y}.png?appid=${apiKey}`, {
        maxZoom: 19,
        opacity: 0.7
    }).addTo(map);
    
    // Guardar referencia a la capa
    window.weatherLayer = weatherLayer;
    
    // Actualizar leyenda
    updateMapLegend(layerType);
}

// Función para actualizar la leyenda del mapa
function updateMapLegend(layerType) {
    const mapLegend = document.getElementById('mapLegend');
    if (!mapLegend) return;
    
    // Limpiar leyenda anterior
    mapLegend.innerHTML = '';
    
    // Configurar leyenda según el tipo de capa
    let legendItems = [];
    
    switch(layerType) {
        case 'temp':
            legendItems = [
                { color: '#0000FF', label: 'Muy frío (< 0°C)' },
                { color: '#00FFFF', label: 'Frío (0-10°C)' },
                { color: '#00FF00', label: 'Templado (10-20°C)' },
                { color: '#FFFF00', label: 'Cálido (20-30°C)' },
                { color: '#FF0000', label: 'Muy cálido (> 30°C)' }
            ];
            break;
        case 'clouds':
            legendItems = [
                { color: '#FFFFFF', label: 'Despejado (0-10%)' },
                { color: '#CCCCCC', label: 'Parcialmente nublado (10-50%)' },
                { color: '#999999', label: 'Nublado (50-90%)' },
                { color: '#666666', label: 'Muy nublado (>90%)' }
            ];
            break;
        case 'precipitation':
            legendItems = [
                { color: '#FFFFFF', label: 'Sin precipitación' },
                { color: '#A4F9C4', label: 'Ligera (0-1 mm/h)' },
                { color: '#16F94B', label: 'Moderada (1-4 mm/h)' },
                { color: '#0F8C2B', label: 'Fuerte (>4 mm/h)' }
            ];
            break;
        case 'wind':
            legendItems = [
                { color: '#FFFFFF', label: 'Calma (0-5 km/h)' },
                { color: '#B3E6FF', label: 'Brisa suave (5-20 km/h)' },
                { color: '#66CCFF', label: 'Brisa moderada (20-40 km/h)' },
                { color: '#0099FF', label: 'Viento fuerte (>40 km/h)' }
            ];
            break;
        case 'pressure':
            legendItems = [
                { color: '#8C66FF', label: 'Baja presión (<1000 hPa)' },
                { color: '#B399FF', label: 'Presión normal (1000-1015 hPa)' },
                { color: '#E6D9FF', label: 'Alta presión (>1015 hPa)' }
            ];
            break;
    }
    
    // Crear elementos de leyenda
    legendItems.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'map-legend__item';
        legendItem.innerHTML = `
            <div class="map-legend__color" style="background-color: ${item.color};"></div>
            <span class="map-legend__label">${item.label}</span>
        `;
        mapLegend.appendChild(legendItem);
    });
}
