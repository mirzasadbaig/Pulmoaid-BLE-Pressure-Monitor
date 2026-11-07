# Pulmoaid — ESP32-Based Respiratory Pressure Monitoring System

**An embedded respiratory pressure monitoring prototype integrating an ESP32-S3, MPRLS pressure sensor, Bluetooth Low Energy (BLE), and an Android application for real-time visualization, pressure analysis, and CSV data export.**

[![ESP32-S3](https://img.shields.io/badge/ESP32--S3-Microcontroller-blue)](https://www.espressif.com/)
![BLE](https://img.shields.io/badge/Communication-BLE-green)
![Platform](https://img.shields.io/badge/Platform-Android-brightgreen)
![Framework](https://img.shields.io/badge/Framework-Capacitor-blue)
![Status](https://img.shields.io/badge/Status-Prototype-orange)

**[Download Android APK](https://github.com/mirzasadbaig/Pulmoaid-BLE-Pressure-Monitor/releases/tag/v1.0.0)**

---

## Overview

Pulmoaid is an embedded hardware and mobile application project developed to acquire, visualize, and record respiratory pressure measurements.

The system uses an **MPRLS pressure sensor** interfaced with a **Seeed XIAO ESP32-S3** through I2C. The ESP32 reads pressure measurements and transmits them wirelessly using Bluetooth Low Energy (BLE) to an Android application.

The mobile application processes the received measurements, displays real-time pressure variations, calculates summary statistics, and enables CSV export for further analysis.

The project demonstrates the integration of **embedded firmware, sensor interfacing, BLE communication, real-time data visualization, and pressure-signal processing**.

> **Disclaimer:** Pulmoaid is an experimental engineering prototype intended for development and research exploration. It is not a clinically validated or certified medical diagnostic or treatment device.

---

## Project Demonstration

Pulmoaid has been implemented as a working hardware–software prototype.

The demonstration can showcase:

- Pressure acquisition from the MPRLS sensor
- Wireless communication with the ESP32-S3
- Real-time pressure graph visualization
- Zero-reference adjustment
- Maximum and minimum pressure monitoring
- Pressure-time area calculation
- Session recording and CSV export

**Demo Video:** [Watch Pulmoaid Working](https://youtu.be/nn1tuQ0zBI4)

*Replace the placeholder with your GitHub-hosted or YouTube demonstration video link. Only list features actually shown in your video.*

---

## Key Features

### Embedded System

- Seeed XIAO ESP32-S3 microcontroller
- MPRLS digital pressure sensor
- I2C-based sensor communication
- Custom BLE GATT service and pressure characteristic
- BLE notifications for wireless pressure transmission
- Periodic sensor acquisition with a nominal 100 ms firmware loop delay
- BLE connection and disconnection handling

### Android Application

- Bluetooth Low Energy device connectivity
- Live pressure graph with a scrolling 10-second time window
- Pressure readings in cmH₂O relative to a zero reference
- Maximum and minimum pressure tracking
- Absolute pressure tracking in hPa
- User-controlled zero-reference adjustment
- Pressure-time area calculation
- Session duration and sample tracking
- Separate Assessment and Training modes
- CSV report generation and sharing
- Portrait orientation for user details and landscape orientation for monitoring

---

## System Architecture

The system separates sensor acquisition, wireless transmission, and mobile data processing.

```text
       Respiratory Pressure Input
                   |
                   v
          MPRLS Pressure Sensor
                   |
                   | I2C
                   v
          Seeed XIAO ESP32-S3
                   |
           Pressure Acquisition
                   |
                   | BLE GATT Notifications
                   v
             Android App
                   |
          +--------+--------+
          |                 |
          v                 v
   Live Visualization   Data Processing
          |                 |
     Pressure Graph    Relative Pressure
     Current Value     Min/Max Tracking
                       Pressure-Time AUC
          |                 |
          +--------+--------+
                   |
                   v
            Session Report
                   |
                   v
               CSV Export
```

### Division of Responsibilities

| Component | Responsibility |
|---|---|
| MPRLS Sensor | Pressure measurement |
| ESP32-S3 Firmware | I2C acquisition and BLE transmission |
| BLE GATT Interface | Wireless pressure data transfer |
| Android Application | Processing, visualization, statistics, and data export |

---

## Hardware Implementation

### Components

| Component | Purpose |
|---|---|
| Seeed XIAO ESP32-S3 | Main embedded controller |
| MPRLS pressure sensor | Digital pressure acquisition |
| Connecting wires | I2C and power connections |
| Suitable power source | Power for the prototype |

### Sensor Connections

The MPRLS sensor communicates with the ESP32-S3 using the I2C interface.

| ESP32-S3 | MPRLS | Function |
|---|---|---|
| D4 / SDA | SDA | I2C data |
| D5 / SCL | SCL | I2C clock |
| GND | GND | Common ground |
| Supply pin | VIN | Sensor power |

**Note:** The actual supply voltage must match the specific MPRLS breakout board being used. The SDA/SCL mapping should be verified against the selected board configuration.

The design uses a straightforward sensor-to-microcontroller interface rather than a custom PCB.

---

## Firmware Implementation

The firmware is developed using the Arduino framework for the ESP32-S3.

### Firmware Workflow

1. Initialize non-volatile storage (NVS).
2. Initialize I2C communication.
3. Establish communication with the MPRLS pressure sensor.
4. Initialize the BLE server.
5. Create a custom BLE service and pressure characteristic.
6. Start BLE advertising.
7. Acquire pressure readings from the sensor.
8. Transmit pressure values to connected clients using BLE notifications.

### BLE Configuration

| Parameter | Value |
|---|---|
| BLE Device Name | `Pressure-Sense` |
| Service UUID | `4fafc201-1fb5-459e-8fcc-c5c9c331914b` |
| Pressure Characteristic UUID | `beefcafe-36e1-4688-b7f5-00000000000c` |
| Characteristic Properties | READ, NOTIFY |
| Transmitted Unit | hPa |
| Nominal Firmware Delay | 100 ms |

The firmware sends pressure values as text-formatted measurements over BLE notifications.

**Firmware Source:** [View ESP32 Firmware](firmware/)

---

## Android Application

The application is developed using **HTML, CSS, JavaScript, Vite, and Capacitor**, enabling a web-based interface to operate as an Android application.

### Technology Stack

| Technology | Purpose |
|---|---|
| HTML / CSS | Application interface |
| JavaScript | Application logic and signal processing |
| Vite | Frontend build tooling |
| Capacitor | Android integration |
| Capacitor BLE Plugin | Bluetooth Low Energy communication |
| Capacitor Filesystem | CSV file creation |
| Capacitor Share | Exporting and sharing CSV reports |
| Screen Orientation Plugin | Portrait/landscape screen management |
| Canvas API | Real-time pressure graph rendering |

### Mobile Application Screenshots

#### Respiratory Pressure Monitoring

![Pulmoaid Assessment Interface](images/assessment-screen.jpeg)

The monitoring screen includes a real-time pressure graph, current pressure measurement, maximum and minimum pressure values, and controls for zeroing, clearing, and exporting data.

#### User Details and Session Selection

![Pulmoaid User Details Interface](images/user-details-screen.jpeg)

The application provides a user details form and options to begin either an Assessment or Training session.

**Application Source:** [View Mobile App Code](mobile-app/)

---

## Operating Modes

Pulmoaid offers two session modes that use the same measurement and processing pipeline.

### Assessment Mode

Assessment Mode is intended for recording pressure measurements during assessment sessions.

It provides live monitoring, pressure statistics, and CSV export for later review.

### Training Mode

Training Mode provides the same pressure measurement and visualization functionality for training sessions.

The selected mode is included in the exported report so that Assessment and Training results can be distinguished.

**Note:** In the current implementation, recordings are held in application memory during a session and exported as CSV files. The application does not provide a permanent in-app patient-record database.

---

## Pressure Processing and Analysis

All pressure processing and statistical calculations are performed by the Android application.

### 1. Absolute Pressure

The MPRLS sensor provides pressure measurements in hectopascals (hPa).

The ESP32 acquires these measurements and transmits them through BLE.

### 2. Relative Pressure

The application establishes a zero-reference pressure and calculates relative pressure using:

\[
P_{\text{relative}} =
(P_{\text{absolute}}-P_{\text{zero}})\times1.01972
\]

Where:

- \(P_{\text{absolute}}\): measured pressure in hPa
- \(P_{\text{zero}}\): zero-reference pressure in hPa
- \(P_{\text{relative}}\): pressure relative to the reference, expressed in cmH₂O

The initial received measurement establishes the reference. The user can subsequently update it using **Set zero**.

### 3. Maximum and Minimum Pressure

The application continuously updates the maximum and minimum relative pressure observed during the recording.

Corresponding absolute pressure values are also tracked.

### 4. Pressure-Time Area Calculation

The mobile application calculates the positive area under the relative pressure-time curve using trapezoidal numerical integration.

For successive samples:

\[
A \approx \sum_{i=1}^{n-1}
\frac{\max(P_i,0)+\max(P_{i+1},0)}{2}
(t_{i+1}-t_i)
\]

Where:

- \(P_i\): relative pressure at sample \(i\)
- \(t_i\): sample time in seconds
- \(A\): accumulated positive pressure-time area in cmH₂O·s

The calculation uses the elapsed time between received samples rather than assuming a perfectly fixed sampling interval.

The accumulated area and pressure extrema are reset when the zero reference is changed.

**Note:** This value represents positive pressure-time area, not physical power.

### 5. Real-Time Graph

The application renders pressure measurements using the HTML Canvas API.

The graph displays the latest 10 seconds of recorded pressure measurements and updates as BLE data is received.

---

## CSV Data Logging and Export

Pulmoaid supports structured CSV exports for further analysis using Python, MATLAB, Excel, or other data-processing tools.

### Report Contents

Each generated report contains:

**Session Information**
- Assessment or Training mode
- Session start timestamp

**User Details**
- User-entered information, where provided

**Summary Statistics**
- Maximum relative pressure
- Minimum relative pressure
- Maximum absolute pressure
- Minimum absolute pressure
- Positive pressure-time area
- Session duration
- Total number of recorded samples

**Measurement Data**

| Field | Unit |
|---|---|
| Time | s |
| Timestamp | ISO 8601 |
| Absolute Pressure | hPa |
| Relative Pressure | cmH₂O |
| Zero Reference | hPa |

### CSV Export Process

1. Start an Assessment or Training session.
2. Connect to the ESP32-S3 using BLE.
3. Record incoming pressure measurements.
4. Disconnect after completing the session.
5. Select **Download CSV**.
6. Save or share the generated report using the Android sharing interface.

CSV export is enabled after disconnecting when recorded samples are available.

The Android application generates the CSV file locally and opens the platform share interface. No cloud patient-record storage is implemented in the supplied application code.

**Privacy:** Real patient information and medical records should not be committed to this public repository. Any demonstration CSV should contain fictional or anonymized information.

---

## Download Android Application

An Android APK is available through GitHub Releases.

**Latest Published Version:** v1.0.0

**[Download Pulmoaid Android APK](https://github.com/mirzasadbaig/Pulmoaid-BLE-Pressure-Monitor/releases/tag/v1.0.0)**

### Installation

1. Download `Pulmoaid.apk` from the release assets.
2. Install it on a compatible Android device.
3. Enable Bluetooth and grant the requested permissions.
4. Power the Pulmoaid ESP32-S3 hardware.
5. Open the application.
6. Enter session details and select Assessment or Training.
7. Connect to the BLE device named `Pressure-Sense`.
8. Begin monitoring pressure measurements.

The ESP32-S3 hardware and compatible pressure sensor are required for live measurements.

---

## Running from Source

The mobile application source code is located in the `mobile-app/` directory.

### Requirements

- Node.js and npm
- Android development environment for native APK builds
- Compatible Capacitor and Android tooling

### Build the Web Application

From the `mobile-app/` directory:

```bash
npm install
npm run build
```

The build creates the `dist/` directory used by Capacitor.

The supplied repository contains the web application source and Capacitor configuration. Rebuilding the Android APK also requires a configured native Android project and Android SDK.

### ESP32 Firmware

1. Open the firmware in Arduino IDE.
2. Install the appropriate ESP32 board support package.
3. Install the Adafruit MPRLS library and required BLE dependencies.
4. Select the appropriate XIAO ESP32-S3 board configuration.
5. Verify the sensor wiring and I2C pin mapping.
6. Compile and upload the firmware.

---

## Repository Structure

```text
Pulmoaid-BLE-Pressure-Monitor/
│
├── firmware/
│   └── Pulmoid.ino
│
├── mobile-app/
│   ├── README.md
│   ├── main.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── capacitor.config.json
│
├── images/
│   ├── assessment-screen.jpeg
│   └── user-details-screen.jpeg
│
└── README.md
```

The compiled Android APK is distributed separately through GitHub Releases.

---

## Current Limitations

- The prototype has not undergone clinical validation.
- Measurement accuracy has not been documented against a calibrated reference instrument.
- Session records must be exported before starting a new recording to avoid losing unsaved data.
- There is no permanent in-app patient-record database.
- The existing interface has limited input validation for user details.
- Hardware connectivity and operation depend on the ESP32-S3 and MPRLS sensor setup.

---

## Future Improvements

- Sensor calibration and validation against reference equipment
- Improved analysis of respiratory pressure patterns
- Enhanced graphing and automated session reports
- Secure local storage and patient-data handling
- Stronger input validation and privacy safeguards
- Additional performance and reliability testing

---

## Author

**Asad Tanveer**

Electronics and Communication Engineering  
Jamia Millia Islamia, New Delhi

[GitHub](https://github.com/mirzasadbaig) | [LinkedIn](https://linkedin.com/in/asadtanveer1109)

---

**Medical Disclaimer:** Pulmoaid is an experimental hardware–software prototype for educational, engineering, and research-oriented use. It is not certified or validated for medical diagnosis, clinical monitoring, or treatment decisions.
