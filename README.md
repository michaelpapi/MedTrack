# MedTrack

**MedTrack** is a comprehensive **medical dispensary management system** designed to streamline medication inventory control, staff operations, and performance monitoring in community healthcare and pharmacy settings. The platform combines robust backend services with an intelligent, AI-powered assistant to support safe, efficient, and data-driven pharmaceutical operations.
_Check out the blog on the project journey here: https://addbabbage.wordpress.com/2025/11/19/finding-y/_

At its core, MedTrack helps dispensaries **track what they stock, how they operate, and how well they perform**—while also providing real-time pharmaceutical insights through an integrated **RAG-powered AI Pharmacist**.

---

## 🚑 What MedTrack Solves

Community pharmacies and medical dispensaries often struggle with:

* Poor visibility into medication inventory and stock movement
* Manual or fragmented staff and role management
* Limited insight into operational performance
* Time-consuming checks for drug dosages, interactions, and common pharmaceutical questions

MedTrack addresses these challenges with a single, unified system.

---

## ✨ Key Features

### 📦 Medication Inventory Management

* Centralized medication catalog
* Real-time stock level tracking
* Expiry date monitoring
* Low-stock alerts and restock visibility
* Transaction history for accountability

### 👩‍⚕️ Staff & Operations Management

* Role-based access control (admin, pharmacist, staff)
* Staff activity tracking
* Secure profile creation, updates, and deactivation
* Clear separation of administrative and operational privileges

### 📊 Performance & Metrics Dashboard

* Inventory turnover insights
* Dispensing activity summaries
* Operational KPIs for decision-making
* Admin-focused analytics views

### 🤖 AI Pharmacist (RAG-Powered)

MedTrack includes an integrated **AI Pharmacist** built using **Retrieval-Augmented Generation (RAG)**, designed specifically for real-world community healthcare use cases.

The AI Pharmacist can:

* Provide **standard dosage guidance** (informational, non-prescriptive)
* Identify **drug–drug interactions**
* Highlight **drug–food interactions**
* Answer common pharmaceutical and dispensary-related questions
* Offer real-time analysis grounded in verified pharmaceutical knowledge sources

> ⚠️ **Disclaimer:** The AI Pharmacist is an assistive tool and does **not replace licensed medical or pharmaceutical judgment**.

---

## 🧠 System Architecture (High-Level)

MedTrack follows a modular, service-oriented architecture:

* **Frontend**: Modern web interface for admins and staff (dashboard-driven)
* **Backend API**: FastAPI-based service handling business logic and data access
* **Database**: Relational database (PostgreSQL/MySQL supported)
* **AI Layer**:

  * RAG pipeline for pharmaceutical knowledge retrieval
  * LLM-powered reasoning over verified documents
* **Containerization**: Docker & Docker Compose for consistent environments

---

## 🛠️ Technology Stack

### Backend

* **FastAPI** – High-performance API framework
* **SQLAlchemy** – ORM and database interaction
* **Alembic** – Database migrations
* **PostgreSQL / MySQL** – Primary data storage

### AI & Data

* **RAG (Retrieval-Augmented Generation)**
* **Vector Database** (for document embeddings)
* **LLM Integration** (configurable)

### DevOps

* **Docker & Docker Compose**
* Environment-based configuration


---

## 🚀 Getting Started (High-Level)

1. Clone the repository
2. Configure environment variables
3. Build and start services using Docker Compose
4. Run database migrations
5. Access the dashboard and API

> Detailed setup instructions can be added in a dedicated **Installation** section if needed.

---

## 🔐 Security & Compliance Considerations

* Role-based access control for sensitive operations
* Audit-friendly activity tracking
* Separation of AI assistance from clinical decision-making
* Designed with healthcare data responsibility in mind

---

## 📌 Use Cases

* Community pharmacies
* Hospital dispensaries
* Clinic medication units
* Health-tech pilot programs

---

## 🧭 Roadmap

* Prescription workflow integration
* Supplier and procurement automation
* Regulatory reporting support
* Expanded AI knowledge sources
* Offline-first support for low-connectivity regions

---

## 📄 License

License information to be defined.

---

## 🙌 Acknowledgements

MedTrack is built to support the realities of modern healthcare operations—balancing **technology, safety, and human expertise**.

---

Video Demonstration


**MedTrack — Smarter Dispensary Management. Safer Medication Decisions.**
