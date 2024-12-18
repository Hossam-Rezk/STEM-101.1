// Include necessary libraries
#include <WiFi.h>
#include <DHT.h>

// DHT11 setup
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// MQ135 setup
#define MQ135PIN 34

// GP2Y10 setup
#define GP2Y10PIN 35    // Analog pin connected to GP2Y10 output
#define LED_PIN 13      // LED control pin for GP2Y10 (used for dust measurement)

// Buzzer setup
#define BUZZER_PIN 12

// Wi-Fi credentials
const char* ssid = "Your_SSID";      // Your Wi-Fi SSID
const char* password = "Your_PASSWORD"; // Your Wi-Fi password

// Thresholds
float tempThreshold = 33.0;          // Threshold for temperature in °C
float humidityThreshold = 55.0;       // Threshold for humidity in %
int mq135Threshold = 300;             // Example threshold for MQ135 (analog value)
int gp2y10Threshold = 100;            // Example threshold for GP2Y10 dust density

// Initialize sensors and pins
void initSensors() {
    dht.begin();
    pinMode(MQ135PIN, INPUT);
    pinMode(GP2Y10PIN, INPUT);
    pinMode(LED_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);  // Ensure buzzer is off
}

// Function to read GP2Y10 sensor value
float readGP2Y10() {
    digitalWrite(LED_PIN, LOW); // Turn on the sensor LED
    delayMicroseconds(280);     // Wait for the sensor to stabilize
    int dustVal = analogRead(GP2Y10PIN);
    digitalWrite(LED_PIN, HIGH); // Turn off the sensor LED
    delayMicroseconds(40);       // Wait for the sensor to cool
    return (dustVal * (5.0 / 4095.0)) * 1000; // Convert to voltage (mV) and scale
}

// Function to read sensors and send data via Serial
void readAndSendData() {
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    int mq135Value = analogRead(MQ135PIN);
    float gp2y10Value = readGP2Y10();

    // Check for sensor read errors
    if (isnan(temperature) || isnan(humidity)) {
        Serial.println("{\"error\": \"Failed to read from DHT sensor!\"}");
        return;
    }

    // Create a JSON-formatted string with sensor data
    String jsonStr = "{";
    jsonStr += "\"temperature\": " + String(temperature) + ", ";
    jsonStr += "\"humidity\": " + String(humidity) + ", ";
    jsonStr += "\"mq135\": " + String(mq135Value) + ", ";
    jsonStr += "\"dust\": " + String(gp2y10Value);
    jsonStr += "}";

    // Send the JSON string over Serial
    Serial.println(jsonStr);

    // Trigger buzzer if thresholds are exceeded
    if (temperature > tempThreshold || humidity > humidityThreshold ||
        mq135Value > mq135Threshold || gp2y10Value > gp2y10Threshold) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(1000);
        digitalWrite(BUZZER_PIN, LOW);
    }
}

// Function to connect to Wi-Fi
void connectToWiFi() {
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
}

void setup() {
    Serial.begin(115200);
    connectToWiFi();
    initSensors();
}

void loop() {
    readAndSendData();
    delay(2000); // Send data every 2 seconds
}
