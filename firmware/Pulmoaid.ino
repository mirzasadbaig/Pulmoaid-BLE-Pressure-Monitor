#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "Adafruit_MPRLS.h"
#include "nvs_flash.h"

// Set to 0 to disable all Serial debug output (e.g. for final use)
#define DEBUG_SERIAL 1

#if DEBUG_SERIAL
  // Only print when a Serial Monitor is actually connected
  #define DBG(x) do { if (Serial) Serial.println(x); } while (0)
#else
  #define DBG(x) do {} while (0)
#endif

// BLE UUIDs
#define SERVICE_UUID            "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define PRESSURE_DATA_CHAR_UUID "beefcafe-36e1-4688-b7f5-00000000000c"

// Pressure Sensor
#define RESET_PIN -1  // Not used
#define EOC_PIN   -1  // Not used
Adafruit_MPRLS mpr = Adafruit_MPRLS(RESET_PIN, EOC_PIN);

// BLE characteristic
BLECharacteristic *pPressureDataCharacteristic;
volatile bool deviceConnected = false;

// BLE Server Callbacks for managing connections
class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        deviceConnected = true;
        DBG("1.0");  // Client connected
    }

    void onDisconnect(BLEServer* pServer) {
        deviceConnected = false;
        DBG("0.0");  // Client disconnected, restarting advertising
        BLEDevice::startAdvertising();
    }
};

void setup() {
#if DEBUG_SERIAL
    Serial.begin(115200);  // Never block waiting for a USB host
    delay(1000);               // Short wait so early messages show if the monitor is open
#endif

    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        nvs_flash_erase();
        nvs_flash_init();
    }

    // Initialize MPRLS sensor (I2C: SDA = D4, SCL = D5 on XIAO ESP32S3)
    Wire.begin();
    if (!mpr.begin()) {
        DBG("2.0");  // Failed to communicate with MPRLS sensor, check wiring
        while (1) {
            delay(10);
        }
    }
    DBG("3.0");  // MPRLS sensor initialized

    // Initialize BLE
    BLEDevice::init("Pressure-Sense");

    BLEServer *pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    // Create BLE Service
    BLEService *pService = pServer->createService(SERVICE_UUID);

    // Create pressure data characteristic
    pPressureDataCharacteristic = pService->createCharacteristic(
        PRESSURE_DATA_CHAR_UUID,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );

    // Descriptors
    pPressureDataCharacteristic->addDescriptor(new BLE2902());  // Enable notifications
    BLEDescriptor *pDescriptor = new BLEDescriptor((uint16_t)0x2901);
    pDescriptor->setValue("Pressure in hPa");
    pPressureDataCharacteristic->addDescriptor(pDescriptor);

    // Start service and advertising
    pService->start();
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMaxPreferred(0x12);
    BLEDevice::startAdvertising();
    DBG("10.0");  // BLE device is ready to be connected
}

void loop() {
    // Read pressure data
    float pressure_hPa = mpr.readPressure();

    if (!isnan(pressure_hPa)) {
        DBG(pressure_hPa);

        // Send over BLE only when a client is connected
        if (deviceConnected) {
            char buf[16];
            snprintf(buf, sizeof(buf), "%.2f", pressure_hPa);
            pPressureDataCharacteristic->setValue((uint8_t*)buf, strlen(buf));
            pPressureDataCharacteristic->notify();
        }
    }

    delay(100);
}
