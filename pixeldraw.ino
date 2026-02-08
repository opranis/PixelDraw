#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32-HUB75-MatrixPanel-I2S-DMA.h>

// Configure for your panel(s) as appropriate!
#define PANEL_WIDTH 64
#define PANEL_HEIGHT 64  	// Panel height of 64 will required PIN_E to be defined.
#define PANELS_NUMBER 1 	// Number of chained panels, if just a single panel, obviously set to 1

#define R1_PIN 33
#define G1_PIN 26
#define B1_PIN 27
#define R2_PIN 14
#define G2_PIN 12
#define B2_PIN 13
#define A_PIN 23
#define B_PIN 19
#define C_PIN 5
#define D_PIN 17
#define E_PIN 32
#define LAT_PIN 4
#define OE_PIN 15
#define CLK_PIN 16

MatrixPanel_I2S_DMA *dma_display = nullptr;

void setup() {
  Serial.begin(115200);
  
  HUB75_I2S_CFG::i2s_pins _pins={R1_PIN, G1_PIN, B1_PIN, R2_PIN, G2_PIN, B2_PIN, A_PIN, B_PIN, C_PIN, D_PIN, E_PIN, LAT_PIN, OE_PIN, CLK_PIN};
  HUB75_I2S_CFG mxconfig(PANEL_WIDTH, PANEL_HEIGHT, PANELS_NUMBER, _pins);
  mxconfig.clkphase = false;

  // OK, now we can create our matrix object
  dma_display = new MatrixPanel_I2S_DMA(mxconfig);

  // let's adjust default brightness to max
  dma_display->setBrightness8(255);    // range is 0-255, 0 - 0%, 255 - 100%

  // Allocate memory and start DMA display
  if( not dma_display->begin() )
      Serial.println("I2S memory allocation failed!!!");
 

  // Connect to WiFi
  Serial.println("Connecting to WiFi...");
  WiFi.begin("ssid", "pwd");
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.println("WiFi connected!");

  // well, hope we are OK, let's draw some colors first :)
  Serial.println("Fill screen: RED");
  dma_display->fillScreenRGB888(0, 255, 0);
  delay(1000);

  Serial.println("Fill screen: GREEN");
  dma_display->fillScreenRGB888(0, 0, 255);
  delay(1000);

  Serial.println("Fill screen: BLUE");
  dma_display->fillScreenRGB888(255, 0, 0);
  delay(1000);

  Serial.println("Fill screen: Neutral White");
  dma_display->fillScreenRGB888(64, 64, 64);
  delay(1000);

  Serial.println("Fill screen: black");
  dma_display->fillScreenRGB888(0, 0, 0);
  delay(1000);
}

void fetchAndDraw() {
  HTTPClient http;

  Serial.println("Making HTTP request...");

  http.begin("http://arrakis.local:8080/most-recent");
  
  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    Serial.println("HTTP request OK!");


    // Use a large enough buffer for a 64x64 array. 
    // If you have PSRAM, this is much safer.
    DynamicJsonDocument doc(128000); 

    // Stream directly to the parser to save RAM
    DeserializationError error = deserializeJson(doc, http.getStream());

    if (!error) {
      Serial.println("No serialization error! Displaying drawing by:");
      const char* name = doc["name"];
      Serial.println(name);

      JsonArray rows = doc["pixels"].as<JsonArray>();
      for (int y = 0; y < rows.size(); y++) {
        JsonArray cols = rows[y].as<JsonArray>();
        for (int x = 0; x < cols.size(); x++) {
          const char* hexStr = cols[x];
          
          // Convert Hex string to 24-bit integer
          uint32_t color = (uint32_t) strtol(hexStr + (hexStr[0] == '#' ? 1 : 0), NULL, 16);
          
          // DMA library uses 8-bit R, G, B components
          uint8_t r = (color >> 16) & 0xFF;
          uint8_t g = (color >> 8) & 0xFF;
          uint8_t b = color & 0xFF;

          dma_display->drawPixelRGB888(x, y, b, r, g);
        }
      }
    } else {
      Serial.println("JSON serialization error!");
    }
  } else {
    Serial.println("HTTP request error!");
  }
  http.end();
}

void loop() {
  // Display new image every 5 seconds
  delay(5000);
  fetchAndDraw();
}