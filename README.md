# Neural-Lens-Multilingual-Voice-Based-Object-Detection-System

Overview

Neural Lens AI is a full-stack intelligent system designed to perform real-time object detection and provide multilingual voice feedback. The system is primarily developed to assist visually impaired users by converting visual information into spoken output. It integrates computer vision, deep learning, and web technologies to create an interactive and accessible environment.

The system not only detects objects but also allows users to interact through voice queries, making it more than a traditional object detection application.

Features
Real-time object detection using YOLOv11
Multilingual voice output for detected objects
Image upload and webcam-based detection
Smart assistant for querying detected objects
Bounding box visualization with confidence scores
User authentication using JWT and OTP verification
Scan history storage and retrieval
Admin dashboard with analytics
Responsive design for desktop and mobile browsers
System Architecture

Frontend (React + Vite)
Backend (Node.js + Express)
Machine Learning Service (FastAPI + YOLOv11)
Database (MongoDB)
Cloud Storage (Cloudinary)

Tech Stack
Programming Languages
JavaScript for frontend and backend development
Python for machine learning inference
Frontend
React.js for building dynamic user interfaces
Vite for fast development and optimized builds
Axios for API communication
React Webcam and MediaDevices API for camera access
CSS for styling and responsive layout
Backend
Node.js as the runtime environment
Express.js for REST API development
Multer for handling image uploads
Nodemailer for sending OTP emails
bcrypt.js for password hashing
JSON Web Token for authentication
dotenv for environment variable management
Database
MongoDB for storing user data and scan history
Mongoose for schema-based data modeling
Machine Learning
YOLOv11 model for real-time object detection
Ultralytics framework for model loading and inference
FastAPI for exposing ML endpoints
Uvicorn for running the ML service
NumPy and Pillow for image processing
Voice Assistant
Web Speech API for speech-to-text
Text-to-Speech API for voice output
SpeechSynthesis API as fallback for offline voice
Implementation Details

The system follows a modular architecture with separation between frontend, backend, and machine learning services.

The user interacts with the system through the frontend, where they can upload an image or capture a frame using the webcam. The frontend sends this data to the backend using Axios.

The backend processes the request using Express.js and forwards the image to the FastAPI-based machine learning service. The YOLOv11 model performs object detection and returns the detected objects along with bounding box coordinates and confidence scores.

The backend then sends the results back to the frontend, where the image is displayed with bounding boxes using the Canvas API. The detected object names are converted into speech using a text-to-speech system.

The system also supports user authentication, where passwords are securely hashed using bcrypt and sessions are managed using JWT. OTP verification is implemented using Nodemailer for additional security.

All detection results and user activities are stored in MongoDB for history tracking and analytics.

Usage
Register or log in to the system
Upload an image or use the webcam for live detection
View detected objects with bounding boxes and confidence scores
Listen to detected object names through voice output
Use voice queries to interact with the system
Access scan history and previous detections
Admin users can monitor system usage and analytics
Offline Capability

The system can be adapted to run in offline mode by replacing cloud-based services with local alternatives.

MongoDB can be replaced with SQLite
Cloudinary can be replaced with local file storage
Email OTP can be replaced with local authentication
Voice output can use browser-based speech synthesis

In offline mode, the YOLO model runs locally through the FastAPI service without requiring internet access.

Limitations
Detection accuracy depends on the training dataset and may fail for unknown objects
Performance may be slower on systems without GPU support
Multilingual voice output depends on available system voices
Real-time detection performance varies based on hardware capabilities
Offline mode may have limited features compared to online deployment
Cloud services like Cloudinary and email OTP require internet connectivity
The system may not perform optimally in low-light or highly cluttered environments
Future Improvements
Improve scene understanding and contextual reasoning
Add spatial awareness for object positioning
Enhance multilingual voice support
Optimize model performance for edge devices
Add custom object detection training
Improve offline mobile support
Setup Instructions

Clone the repository:

git clone https://github.com/your-username/neural-lens-ai.git

Install dependencies for frontend, backend, and ML service separately.

Run frontend:

npm run dev

Run backend:

npm run dev

Run ML service:

uvicorn main:app --reload

Conclusion

Neural Lens AI demonstrates the integration of deep learning, web development, and accessibility-focused design to create an intelligent system capable of assisting users in understanding their surroundings. The project highlights real-time object detection, voice interaction, and full-stack architecture, making it a practical and scalable solution.
