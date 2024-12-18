// Chart.js configurations for the sensors
const maxDataPoints = 50; // Limit the number of points in the charts

const tempCtx = document.getElementById('temperatureChart').getContext('2d');
const tempChart = new Chart(tempCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperature (°C)',
            data: [],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: { title: { display: true, text: 'Time' } },
            y: { title: { display: true, text: 'Temperature (°C)' } }
        }
    }
});

const humCtx = document.getElementById('humidityChart').getContext('2d');
const humChart = new Chart(humCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Humidity (%)',
            data: [],
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: { title: { display: true, text: 'Time' } },
            y: { title: { display: true, text: 'Humidity (%)' } }
        }
    }
});

const mqCtx = document.getElementById('mq135Chart').getContext('2d');
const mqChart = new Chart(mqCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Air Quality (ppm)',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: { title: { display: true, text: 'Time' } },
            y: { title: { display: true, text: 'Air Quality (ppm)' } }
        }
    }
});

const dustCtx = document.getElementById('dustSensorChart').getContext('2d');
const dustChart = new Chart(dustCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Dust Concentration (μg/m³)',
            data: [],
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: { title: { display: true, text: 'Time' } },
            y: { title: { display: true, text: 'Dust Concentration (μg/m³)' } }
        }
    }
});

// Serial communication and data handling
let port;
let decoder;
let buffer = '';

// Add event listener to connect to ESP32
document.getElementById('connect-btn').addEventListener('click', async () => {
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });

        const textDecoder = new TextDecoderStream();
        port.readable.pipeTo(textDecoder.writable);
        decoder = textDecoder.readable.getReader();

        document.getElementById('connect-btn').textContent = 'Connected to ESP32';
        readSerialData();
    } catch (error) {
        console.error('Error connecting to ESP32:', error);
        alert('Failed to connect to ESP32!');
    }
});

// Read data from the serial port
async function readSerialData() {
    try {
        while (true) {
            const { value, done } = await decoder.read();
            if (done) break;

            buffer += value;
            if (buffer.includes('\n')) {
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep the remainder
                lines.forEach(line => {
                    try {
                        const data = JSON.parse(line.trim());
                        updateChartsWithData(data);
                    } catch (err) {
                        console.error('Error parsing JSON:', err);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error reading serial data:', error);
    }
}

// Update charts with incoming data
function updateChartsWithData(data) {
    const now = new Date().toLocaleTimeString();

    // Update Temperature Chart
    updateChart(tempChart, data.temperature, now);

    // Update Humidity Chart
    updateChart(humChart, data.humidity, now);

    // Update Air Quality Chart
    updateChart(mqChart, data.mq135, now);

    // Update Dust Sensor Chart
    updateChart(dustChart, data.dust, now);

    // Update Stats
    document.getElementById('avg-temp').textContent = `${data.temperature?.toFixed(1) ?? 'N/A'} °C`;
    document.getElementById('avg-hum').textContent = `${data.humidity?.toFixed(1) ?? 'N/A'} %`;
    document.getElementById('avg-air').textContent = `${data.mq135 ?? 'N/A'} ppm`;
    document.getElementById('avg-dust').textContent = `${data.dust?.toFixed(1) ?? 'N/A'} μg/m³`;

    // Display warning if thresholds are exceeded
    const warningElement = document.getElementById('warning');
    if (data.temperature > 30 || data.humidity > 70 || data.mq135 > 300 || data.dust > 150) {
        warningElement.style.display = 'block';
        warningElement.textContent = 'Warning: Threshold exceeded!';
    } else {
        warningElement.style.display = 'none';
    }
}

// Helper function to update charts and maintain max points
function updateChart(chart, value, label) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);
    if (chart.data.labels.length > maxDataPoints) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.update();
}
