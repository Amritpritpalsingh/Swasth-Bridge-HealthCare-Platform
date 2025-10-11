# SwasthBridge – Healthcare Management System

## Project Overview
SwasthBridge is a modern web application designed to efficiently connect **patients** and **doctors**. Patients can book appointments, upload medical information, make payments, and download summaries, while doctors can manage schedules, patients, and payments. The platform emphasizes **convenience**, **security**, and a **seamless user experience**.

---

## Features

### Patient Features
- **Profile Management:** Edit personal details, medical history, and profile picture.  
- **Appointment Booking:** Request online or offline appointments with doctors.  
- **Payment Integration:** Pay via UPI with QR code support and upload payment screenshots.  
- **Download Reports:** Generate and download appointment summaries as PDF files.  
- **View Appointments:** Track pending, confirmed, and completed appointments.  

### Doctor Features
- **Profile Management:** Maintain professional profile including clinic details, specialty, and consultation types.  
- **Patient Management:** Access patient info, diagnosis, prescriptions, and appointment history.  
- **Payment Verification:** Confirm payments received and manage records.  
- **Appointment Notifications:** Real-time notifications for new patient requests.  

### Admin / General Features
- **Top Doctors Dashboard:** Analytics for doctors based on appointments and patient visits.  
- **Cloud File Storage:** Profile pictures and payment screenshots uploaded to Cloudinary.  
- **Secure Authentication:** Session-based login for patients and doctors.  
- **Validation & Security:** Forms validated with Joi; sensitive info stored in `.env`.  

---

## Tech Stack
- **Backend:** Node.js, Express.js, Mongo Atlas   
- **Frontend:** EJS templates, Bootstrap 5  
- **Authentication:** Passport.js (session-based)  
- **File Uploads:** Multer + Cloudinary  
- **PDF Generation:** PDFKit  
- **Realtime Updates:** Socket.io (appointment notifications)  
- **Validation:** Joi  

---

## 📁 Project Structure

SwasthBridge/  
├─ controllers/      # Backend logic  
├─ models/           # MongoDB schemas  
├─ public/           # Static files (CSS, JS, images)  
├─ routes/           # Express routes  
├─ utils/            # Helpers (multer, async catch, ID generator)  
├─ views/            # EJS templates  
├─ .env              # Environment variables (ignored)  
├─ .gitignore  
├─ package.json  
└─ server.js

---

## Environment Variables
Create a `.env` file in the root directory with the following variables:
PORT By Default 6006

MONGO_URI=your_mongodb_connection_string

SESSION_SECRET=your_session_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret

GOOGLE_CLIENT_ID=your_client_id

GOOGLE_CLIENT_SECRET==your_client_secret

**Important:** Never commit `.env` to GitHub.

---

## Installation & Setup
1. **Clone the repository**
   ```bash git clone https://github.com/yourusername/SwasthBridge.git cd SwasthBridge```
2. **Install dependencies**
   ```npm install```
3. **Add environment variables in .env**
   
4. **Run the project locally**
   ```npm run dev``` 
5. **Access the app**
   ```http://localhost:6006/sb```
## Usage

### Patient Workflow
- **Sign Up / Login:** Create an account and securely log in.  
- **Profile Management:** Update personal details, medical history, and profile picture.  
- **Book Appointment:**  
  - Choose **online (video call)** or **offline consultation** with a doctor.  
  - Select date and time (future times only).  
  - Free to book appointments (no charges at booking).  
- **View Appointments:** Track **pending**, **confirmed**, and **completed** appointments.  
- **Video Consultation:** Attend **online appointments via integrated video calls**.  
- **Payments:** Upload payment screenshots for consultations if required.  
- **Download Reports:** Access and download appointment summaries or prescriptions in PDF format.  

### Doctor Workflow
- **Login / Profile Management:** Maintain professional profile including clinic details, specialty, and consultation types.  
- **View Patients & Appointments:** Access patient information, appointment history, and consultation notes.  
- **Video Consultation:** Conduct online consultations through the platform.  
- **Offline Consultation Management:** Record in-person consultations and update appointment status.  
- **Payment Verification:** Verify payments received from patients and manage records.  
- **Real-Time Notifications:** Get notified for new appointment requests or updates.  

---

## Deployment
- **Recommended Hosting Platforms:** Vercel, Render, Heroku  
- **Environment Variables:** Set in the hosting platform (refer to `.env` file setup).  
- **Database:** Use MongoDB Atlas for cloud storage.  
- **Cloud Storage:** Profile pictures, payment screenshots, and documents are uploaded to Cloudinary.  
## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## Author

**Name:** Amritpirt pal singh
**GitHub:** [github.com/yourusername](https://github.com/Amritpritpalsingh)  
**Email:** [your.email@example.com](amritkps01@gmail.com)
