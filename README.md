# PayGuard – Payment Tracking and Verification System

PayGuard is a secure and robust payment management and verification system designed for tracking payments, verifying user-submitted documents, and enabling role-based access control for admins and users. This project adheres to the requirements of the AdaptifyLoop Developer Recruitment Task.

## Features

### User Authentication
- Signup, Login, and Logout using Supabase Auth (email/password).
- Role-based access control: Admin and User roles.

### Payment Management
- **User Features**:
  - Create a payment request with Title, Amount, and Status.
  - View and track payment status (Pending, Approved, Rejected).
- **Admin Features**:
  - View all user payments.
  - Approve or reject payment requests and update their statuses.

### Document Upload for Verification
- Users upload identity verification documents (PDF, JPG, PNG).
- Admin reviews documents and updates their verification status (Pending, Approved, Rejected).

### Admin Dashboard
- Displays a summary of total payments and status-based breakdowns.
- Filters payments by date and status for effective management.

### Additional Features
- Integration with Stripe or PayPal sandbox for payments.
- Email notifications for status updates.
- PDF invoice generation for completed payments.
- Admin analytics with charts for payment summaries.

## Technologies Used

### Frontend
- **React.js** with **TypeScript**
- **Tailwind CSS** for styling

### Backend
- **Next.js API Routes**

### Database
-  MongoDB (NoSQL-like structure)

### Storage
- Supabase Storage for document uploads

### Deployment
- Hosted on Vercel (Live URL included below)

## Project Setup Instructions

### Prerequisites
1. Node.js and npm installed on your machine.
2. Supabase account and project configured for authentication and storage.
3. Stripe or PayPal developer account for sandbox testing.
4. PostgreSQL or MongoDB database.

### Installation
1. Clone the repository:
   ```bash
   ```git clone (https://github.com/aayman01/payGuard)
   ```cd payguard
   ```npm install
   ```npm run dev
