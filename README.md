# PathoScope: A Hybrid Laboratory Information System

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

HemaPath LIS is a comprehensive, web-based Laboratory Information System (LIS). It is designed to manage two distinct clinical workflows in a single, unified platform: **numerical data analysis (Hematology)** and **advanced medical imaging (Digital Pathology)**.

[cite_start]This system is built to enhance efficiency and diagnostic accuracy by providing a patient-facing portal for results, a full-featured administrative backend for lab technicians, and a powerful, AI-assisted diagnostic viewer for pathologists[cite: 3, 23, 24].

## 🎓 Course Project

This system is the final deliverable for the **Healthcare System Project (HCIS)**. [cite_start]The project's goal is to design and develop a unique healthcare solution that encompasses patient management, billing, scheduling, and advanced clinical diagnostic support[cite: 1, 3, 4].

* **Instructors:** Dr. Eman Ayman, Eng. [cite_start]Yara Elshamy [cite: 46, 47]
* [cite_start]**Phase 0 Deadline:** November 7, 2025 [cite: 48]

---

## ✨ Key Features

### [cite_start]1. Role-Based Access Control [cite: 8-10]

The system provides secure, distinct interfaces for four unique user roles:

* **Administrator:** Manages system settings, user accounts, and views financial/operational reports.
* **Patient:** Accesses the Patient Portal to manage their profile, appointments, and results.
* **Lab Technician (Clinical Staff):** Manages the core LIS dashboard, including sample accessioning, patient scheduling, and entering numerical test results.
* **Pathologist (Clinical Staff):** A specialized role with access to a diagnostic queue and the advanced DICOM viewer for case analysis and sign-off.

### [cite_start]2. Patient Portal [cite: 11]

A secure, patient-facing web application with full self-service capabilities:

* [cite_start]**Profile Management:** Patient registration and profile management[cite: 12].
* [cite_start]**Appointment Scheduling:** A self-service calendar for booking sample collection times[cite: 13].
* **Unified Results Dashboard:** A single page to view and access the status and reports for all tests (both Hematology and Pathology).
* [cite_start]**Medical History:** Access to past lab reports and diagnoses[cite: 14].
* [cite_start]**Billing & Payments:** View itemized invoices and process payments[cite: 16].

### 3. Core LIS (Clinical Staff Portal)

The operational backend for managing all lab workflows:

* **Sample Accessioning:** Log and track new patient samples, linking them to a patient's record.
* **Real-time Sample Tracking:** A dashboard to monitor the status of every sample (e.g., `Sample Received`, `In-Analysis`, `Awaiting Validation`, `Report Ready`).
* **Instrument Queue Simulation:** Manages a "worklist" for lab analyzers, simulating real-world processing queues.

### 4. Hematology Module (Numerical Data)

Manages the workflow for tests that produce numerical data (e.g., Complete Blood Count).

* **Numerical Data Entry:** A simple interface for technicians to input results from analyzers.
* [cite_start]**Rule-Based CDSS:** Provides "intelligent diagnostic support" by automatically flagging results that fall outside of pre-defined normal ranges[cite: 23].

### 5. Digital Pathology Module (Imaging Data)

The system's most advanced module for analyzing whole-slide images (WSI) in DICOM format.

* [cite_start]**Advanced DICOM Viewer:** An interactive, web-based viewer for digital pathology slides, featuring all required tools like zoom, pan, rotate, and contrast adjustment[cite: 26, 27].
* [cite_start]**AI-Powered CDSS:** An integrated module that uses **TensorFlow/PyTorch** machine learning models to provide "intelligent diagnostic support"[cite: 23, 24, 39]. Pathologists can run AI analysis to automatically count cells or highlight potential regions of interest.
* [cite_start]**Multiplanar Reconstruction (MPR):** Enables users to view Z-stack (multi-slice) images in multiple planes (axial, sagittal, coronal)[cite: 29].
* [cite_start]**3D Volume Rendering:** Provides a 3D representation of the tissue sample for detailed analysis[cite: 30].

---

## 💻 Technology Stack

This project is built on a modern, decoupled web stack.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | **Django (Python)** | A high-level framework for rapid, secure backend development. Manages all user data, business logic, and API endpoints. |
| **Frontend** | **React.js** | A JavaScript library for building the entire user interface, including the Patient Portal and Clinical Staff dashboards. |
| **Database** | **PostgreSQL** | [cite_start]A powerful, open-source relational database to store all patient data, appointments, and test results[cite: 40]. |
| **DICOM (Backend)**| **PyDICOM** | [cite_start]A Python library for parsing and handling DICOM files on the server[cite: 39]. |
| **DICOM (Frontend)**| **Cornerstone.js / VTK.js** | JavaScript libraries for building the in-browser, high-performance DICOM viewer. |
| **AI / CDSS** | **TensorFlow / PyTorch** | [cite_start]Deep learning frameworks for running the machine learning models that power the CDSS module[cite: 39]. |

---

## 🚀 Getting Started

Instructions on how to clone and run a local instance of this project.

### Prerequisites

* Python 3.10+
* Node.js 18+
* PostgreSQL

### 1. Clone the Repository

```bash
git clone [https://github.com/YOUR_USERNAME/YOUR_REPO.git](https://github.com/YOUR_USERNAME/YOUR_REPO.git)
cd HemaPath-LIS
```

### 2. Backend Setup (Django)

```bash
# Navigate to the backend folder
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # (on Windows, use `venv\Scripts\activate`)

# Install dependencies
pip install -r requirements.txt

# Setup the database
python manage.py makemigrations
python manage.py migrate

# Run the backend server
python manage.py runserver
```

### 3. Frontend Setup (React)

```bash
# Open a new terminal and navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Run the frontend development server
npm start
```

Your LIS should now be running, with the React app on `http://localhost:3000` and the Django API on `http://localhost:8000`.

---

## 📄 License

This project is licensed under the MIT License.
