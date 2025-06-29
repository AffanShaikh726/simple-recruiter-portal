# Simple Recruiter Portal

A modern web application for recruiters to manage their workflow, candidates, and job postings. Built with Angular, Supabase, Tailwind CSS, and daisyUI.

## 🚀 Features

- **User Authentication**
  - Secure login and registration with Supabase Auth
  - Email/password authentication
  - Protected routes with auth guards

- **Dashboard**
  - Overview of key recruiting metrics
  - Quick access to recent activities
  - Upcoming interviews and tasks

- **Candidate Management**
  - Add, view, and manage candidate profiles
  - Track candidate status and notes
  - Store and manage candidate documents with Supabase Storage

- **Job Management**
  - Create and manage job postings
  - View job details and applications
  - Track candidate pipeline for each position

- **Profile & Settings**
  - Update personal information
  - Change password
  - Configure notification preferences

## 🛠️ Technologies Used

- **Frontend**: Angular 19+ with Standalone Components
- **UI/UX**: 
  - Tailwind CSS for utility-first styling
  - daisyUI component library
  - Responsive design for all devices
- **Backend**: 
  - Supabase Authentication
  - Supabase PostgreSQL Database
  - Supabase Storage for file uploads
  - Row Level Security (RLS) for data protection
- **State Management**: RxJS Observables & Services
- **Form Handling**: Reactive Forms with Validation
