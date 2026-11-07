# Pulmoaid – ESP32-Based Respiratory Pressure Monitoring System

A wireless respiratory pressure monitoring prototype integrating an ESP32-S3, MPRLS pressure sensor, Bluetooth Low Energy (BLE), and a mobile application for real-time visualization and data logging.

## Overview

Pulmoaid is an embedded hardware and mobile application project designed to measure and visualize respiratory pressure measurements.

The system uses an MPRLS pressure sensor interfaced with a Seeed XIAO ESP32-S3. The microcontroller acquires pressure readings over I2C and transmits the measurements to a mobile application using Bluetooth Low Energy.

The application provides a live pressure graph, current pressure readings, maximum and minimum pressure tracking, and CSV data export for further analysis.

The prototype is intended for respiratory monitoring and research-oriented applications. It is not a certified medical diagnostic device.

## Key Features

### Embedded System
- ESP32-S3-based pressure monitoring.
- MPRLS pressure sensor integration.
- I2C communication.
- Custom BLE GATT service and characteristic.
- Periodic pressure acquisition.
- BLE notifications for connected devices.

### Mobile Application
- Wireless connection to the device.
- Real-time pressure visualization.
- Current pressure display.
- Maximum and minimum pressure tracking.
- Zero-setting functionality.
- Data clearing functionality.
- CSV data export.
- Assessment and training interfaces.

## Hardware Components

| Component | Function |
|---|---|
| Seeed XIAO ESP32-S3 | Main microcontroller |
| MPRLS pressure sensor | Pressure measurement |

## Technology Stack

**Embedded Firmware**
- C/C++
- Arduino Framework
- ESP32-S3
- I2C
- Adafruit MPRLS Library

**Wireless Communication**
- Bluetooth Low Energy
- BLE GATT
- Custom service and characteristic UUIDs

**Mobile Application**
- Capacitor
- Vite
- BLE communication
- Data visualization and CSV export

## System Architecture

```text
Respiratory Pressure Input
          |
          v
   MPRLS Pressure Sensor
          |
         I2C
          |
          v
    XIAO ESP32-S3
   Pressure Acquisition
          |
          v
   BLE GATT Service
          |
    BLE Notifications
          |
          v
     Mobile Application
          |
     +----+-----+
     |          |
     v          v
 Live Graph   Data Logging
     |          |
     v          v
 Min / Max    CSV Export
 Monitoring
```

## Mobile Application Screenshots

### Respiratory Pressure Assessment

![Pulmoaid Assessment Interface](images/assessment-screen.jpg)

The assessment interface displays live pressure measurements, pressure trends, maximum and minimum values, and data export controls.

### User Details Interface

![Pulmoaid User Details Interface](images/user-details-screen.jpg)

The application includes a user details interface for assessment-related information.

## Firmware Details

- BLE device name: `Pressure-Sense`
- Sensor interface: I2C
- BLE characteristic properties: READ and NOTIFY
- Firmware measurement interval: 100 ms
- Pressure sensor library: Adafruit MPRLS

## Repository Structure

```text
Pulmoaid/
├── firmware/
│   └── Pulmoid.ino
├── mobile-app/
├── hardware/
├── docs/
├── images/
└── README.md
```

## Future Improvements

- Pressure sensor calibration and measurement validation.
- Improved respiratory pressure analysis.
- Enhanced data visualization and reporting.
- Secure storage and management of user data.
- Evaluation against appropriate reference measurement equipment.

## Disclaimer

Pulmoaid is an engineering prototype intended for development, testing, and research exploration. It has not been established as a clinically validated diagnostic or treatment device. Measurements should not be used for medical decisions without appropriate validation and regulatory approval.

## Author

**Asad Tanveer**

Electronics and Communication Engineering  
Jamia Millia Islamia

[GitHub](https://github.com/mirzasadbaig) | [LinkedIn](https://linkedin.com/in/asadtanveer1109)
