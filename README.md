# Neural Lens 
Multilingual Voice-Based Real-Time Object Detection System

## Overview

Neural Lens AI is a full-stack intelligent system designed to perform real-time object detection and provide multilingual voice feedback. The system is primarily developed to assist visually impaired users by converting visual information into spoken output.

It integrates computer vision, deep learning, and web technologies to create an interactive and accessible environment.

The system not only detects objects but also allows users to interact through voice queries, making it more than a traditional object detection application.

---

## Features

- Real-time object detection using YOLOv11  
- Multilingual voice output for detected objects  
- Image upload and webcam-based detection  
- Smart assistant for querying detected objects  
- Bounding box visualization with confidence scores  
- User authentication using JWT and OTP verification  
- Scan history storage and retrieval  
- Admin dashboard with analytics  
- Responsive design for desktop and mobile browsers  

---

## System Architecture

Frontend (React + Vite)  
Backend (Node.js + Express)  
Machine Learning Service (FastAPI + YOLOv11)  
Database (MongoDB)  
Cloud Storage (Cloudinary)  

---

## Tech Stack

### Programming Languages
- JavaScript for frontend and backend development  
- Python for machine learning inference  

### Frontend
- React.js for building dynamic user interfaces  
- Vite for fast development and optimized builds  
- Axios for API communication  
- React Webcam and MediaDevices API for camera access  
- CSS for styling and responsive layout  

### Backend
- Node.js as the runtime environment  
- Express.js for REST API development  
- Multer for handling image uploads  
- Nodemailer for sending OTP emails  
- bcrypt.js for password hashing  
- JSON Web Token for authentication  
- dotenv for environment variable management  

### Database
- MongoDB for storing user data and scan history  
- Mongoose for schema-based data modeling  

### Machine Learning
- YOLOv11 model for real-time object detection  
- Ultralytics framework for model loading and inference  
- FastAPI for exposing ML endpoints  
- Uvicorn for running the ML service  
- NumPy and Pillow for image processing  

### Voice Assistant
- Web Speech API for speech-to-text  
- Text-to-Speech API for voice output  
- SpeechSynthesis API as fallback for offline voice  

---

## Implementation Details

The system follows a modular architecture with separation between frontend, backend, and machine learning services.

The user interacts with the system through the frontend, where they can upload an image or capture a frame using the webcam.

The frontend sends this data to the backend using Axios. The backend processes the request and forwards the image to the FastAPI-based ML service.

The YOLOv11 model performs object detection and returns detected objects along with bounding box coordinates and confidence scores.

The backend sends the results back to the frontend, where the image is displayed with bounding boxes.

Detected object names are converted into speech using a text-to-speech system.

The system also supports authentication using JWT and bcrypt, with OTP verification via email.

All detection results and user activities are stored in MongoDB.

---

## Usage

1. Register or log in to the system  
2. Upload an image or use webcam for detection  
3. View detected objects with bounding boxes  
4. Listen to detected objects via voice output  
5. Ask queries using the smart assistant  
6. View scan history and past detections  

---

## Limitations

- Detection accuracy depends on dataset and may fail for unknown objects  
- Performance may be slower on systems without GPU  
- Voice output depends on available system/browser voices  
- Real-time performance varies based on hardware  
- Offline mode has limited functionality  
- Cloud services require internet connectivity  
- Performance may drop in low-light or cluttered environments  

---

## Future Improvements

- Add spatial awareness (left, right, distance)  
- Improve scene understanding  
- Enhance multilingual voice support  
- Optimize for edge devices  
- Add custom object training  
- Improve offline mobile support  

---

