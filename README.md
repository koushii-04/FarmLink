FarmLink
FarmLink is a full-stack B2B agricultural marketplace designed to connect local farmers directly with institutional bulk buyers.

The platform features a real-time, socket-based negotiation hub that allows buyers and farmers to engage in structured, turn-taking price discovery.

Farmers have access to a dedicated inventory management command center where they can track available stock, set minimum order quantities, and assign standardized quality grades.


Tech Stack

 Frontend: React.js, Vite, Tailwind CSS, Socket.io-client
Backend: FastAPI, Python, WebSockets (Socket.io)
Database: MySQL
Payments: Razorpay Checkout SDK

Environment Variables

Backend (backend/.env)
Create a `.env` file in the `backend/` directory and add the following keys:
```env
# Server
PORT=8000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=mysql+pymysql://<username>:<password>@localhost:3306/farmlink_db

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Razorpay Escrow
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

Frontend (frontend/.env)
VITE_API_BASE_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here

Backend Setup:
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

Frontend Setup:
cd frontend
npm install
npm run dev
