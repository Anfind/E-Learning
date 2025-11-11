# 📚 API Endpoints Documentation

**Learning Platform Backend API** - Complete Reference Guide

Base URL: `http://localhost:8000/api`

---

## 📑 Table of Contents

1. [Authentication](#1-authentication) (5 endpoints)
2. [User Management](#2-user-management) (7 endpoints)
3. [Major Management](#3-major-management) (5 endpoints)
4. [Subject Management](#4-subject-management) (5 endpoints)
5. [Lesson Management](#5-lesson-management) (5 endpoints)
6. [Exam Management](#6-exam-management) (6 endpoints)
7. [Enrollment](#7-enrollment) (4 endpoints)
8. [Learning Progress](#8-learning-progress) (4 endpoints)
9. [Exam Taking](#9-exam-taking) (4 endpoints)
10. [Dashboard](#10-dashboard) (2 endpoints)
11. [Blog](#11-blog) (7 endpoints)
12. [Q&A](#12-qa) (11 endpoints)
13. [Admin Statistics](#13-admin-statistics) (5 endpoints)
14. [Admin Reports](#14-admin-reports) (3 endpoints)
15. [Stream Chat](#15-stream-chat) (8 endpoints)

**Total: 81 API Endpoints**

---

## 1. Authentication

### 1.1 Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "0123456789"
}
```

**Response:**
```json
{
  "message": "User registered successfully. Please wait for admin approval.",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "PENDING",
      "role": "USER"
    }
  }
}
```

---

### 1.2 Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "status": "ACTIVE"
    }
  }
}
```

---

### 1.3 Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "avatar": "/uploads/avatars/avatar.jpg",
    "faceRegistered": false
  }
}
```

---

### 1.4 Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer {token}
```

---

### 1.5 Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

---

## 2. User Management

### 2.1 List Users (Admin)
```http
GET /api/users?page=1&limit=20&status=ACTIVE&role=USER&search=john
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (enum): PENDING | APPROVED | ACTIVE | DEACTIVE
- `role` (enum): USER | ADMIN
- `search` (string): Search by name, email, or phone

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "0123456789",
      "status": "ACTIVE",
      "role": "USER",
      "avatar": "/uploads/avatars/avatar.jpg",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### 2.2 Get Pending Users (Admin)
```http
GET /api/users/pending
Authorization: Bearer {admin_token}
```

---

### 2.3 Get User Detail (Admin)
```http
GET /api/users/:id
Authorization: Bearer {admin_token}
```

---

### 2.4 Approve User (Admin)
```http
PATCH /api/users/:id/approve
Authorization: Bearer {admin_token}
```

---

### 2.5 Update User Status (Admin)
```http
PATCH /api/users/:id/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "ACTIVE"
}
```

---

### 2.6 Update Profile
```http
PATCH /api/users/:id
Authorization: Bearer {token}
Content-Type: multipart/form-data

avatar: [file]
name: John Doe Updated
phone: 0987654321
```

---

### 2.7 Delete User (Admin)
```http
DELETE /api/users/:id
Authorization: Bearer {admin_token}
```

---

## 3. Major Management

### 3.1 List Majors (Public)
```http
GET /api/majors?page=1&limit=10
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Computer Science",
      "description": "Learn programming and software development",
      "imageUrl": "/uploads/courses/cs.jpg",
      "order": 1,
      "isActive": true,
      "_count": {
        "subjects": 5,
        "enrollments": 120
      }
    }
  ]
}
```

---

### 3.2 Get Major Detail (Public)
```http
GET /api/majors/:id
```

---

### 3.3 Create Major (Admin)
```http
POST /api/majors
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

courseImage: [file]
name: Data Science
description: Learn data analysis and machine learning
order: 3
isActive: true
```

---

### 3.4 Update Major (Admin)
```http
PATCH /api/majors/:id
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

name: Data Science Updated
description: New description
```

---

### 3.5 Delete Major (Admin)
```http
DELETE /api/majors/:id
Authorization: Bearer {admin_token}
```

---

## 4. Subject Management

### 4.1 List Subjects (Public)
```http
GET /api/subjects?majorId={uuid}&status=active
```

---

### 4.2 Get Subject Detail (Public)
```http
GET /api/subjects/:id
```

**Response includes:**
- Subject info
- Prerequisite subject (if any)
- List of lessons
- List of exams
- User progress (if authenticated)

---

### 4.3 Create Subject (Admin)
```http
POST /api/subjects
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "majorId": "uuid",
  "name": "Introduction to Python",
  "description": "Learn Python basics",
  "prerequisiteId": "uuid_of_prerequisite_subject",
  "order": 1,
  "isActive": true
}
```

---

### 4.4 Update Subject (Admin)
```http
PATCH /api/subjects/:id
Authorization: Bearer {admin_token}
```

---

### 4.5 Delete Subject (Admin)
```http
DELETE /api/subjects/:id
Authorization: Bearer {admin_token}
```

---

## 5. Lesson Management

### 5.1 List Lessons (Public/User)
```http
GET /api/lessons?subjectId={uuid}&status=active
Authorization: Bearer {token} (optional)
```

**If authenticated**: Returns user's progress for each lesson

---

### 5.2 Get Lesson Detail
```http
GET /api/lessons/:id
Authorization: Bearer {token} (optional)
```

---

### 5.3 Create Lesson (Admin)
```http
POST /api/lessons
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "subjectId": "uuid",
  "name": "Variables and Data Types",
  "description": "Learn about Python variables",
  "videoUrl": "https://youtube.com/watch?v=xxx",
  "duration": 45,
  "prerequisiteId": "uuid_of_prerequisite_lesson",
  "order": 1,
  "isActive": true
}
```

---

### 5.4 Update Lesson (Admin)
```http
PATCH /api/lessons/:id
Authorization: Bearer {admin_token}
```

---

### 5.5 Delete Lesson (Admin)
```http
DELETE /api/lessons/:id
Authorization: Bearer {admin_token}
```

---

## 6. Exam Management (Admin)

### 6.1 List Exams (Admin)
```http
GET /api/exams?subjectId={uuid}
Authorization: Bearer {admin_token}
```

---

### 6.2 Get Exam Detail (Admin)
```http
GET /api/exams/:id
Authorization: Bearer {admin_token}
```

**Response includes questions and user attempts**

---

### 6.3 Create Exam (Admin)
```http
POST /api/exams
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "subjectId": "uuid",
  "name": "Python Final Exam",
  "description": "Test your Python knowledge",
  "duration": 90,
  "passingScore": 70,
  "isRequired": true,
  "isActive": true
}
```

---

### 6.4 Add Questions (Admin)
```http
POST /api/exams/:id/questions
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "questions": [
    {
      "question": "What is Python?",
      "type": "MULTIPLE_CHOICE",
      "options": ["A programming language", "A snake", "A framework", "A database"],
      "correctAnswer": "A",
      "points": 2,
      "order": 1
    },
    {
      "question": "Python is interpreted?",
      "type": "TRUE_FALSE",
      "correctAnswer": "True",
      "points": 1,
      "order": 2
    }
  ]
}
```

---

### 6.5 Update Exam (Admin)
```http
PATCH /api/exams/:id
Authorization: Bearer {admin_token}
```

---

### 6.6 Delete Exam (Admin)
```http
DELETE /api/exams/:id
Authorization: Bearer {admin_token}
```

---

## 7. Enrollment

### 7.1 Enroll in Major
```http
POST /api/enrollments
Authorization: Bearer {token}
Content-Type: application/json

{
  "majorId": "uuid"
}
```

---

### 7.2 Get My Enrollments
```http
GET /api/enrollments/my
Authorization: Bearer {token}
```

**Response includes progress calculation for each major**

---

### 7.3 Get All Enrollments (Admin)
```http
GET /api/enrollments?page=1&majorId={uuid}&userId={uuid}
Authorization: Bearer {admin_token}
```

---

### 7.4 Unenroll
```http
DELETE /api/enrollments/:id
Authorization: Bearer {token}
```

---

## 8. Learning Progress

### 8.1 Start Lesson
```http
POST /api/progress/lessons/:id/start
Authorization: Bearer {token}
```

**Checks:**
- Enrollment in major
- Prerequisite completion
- Subject prerequisite

---

### 8.2 Update Watch Time
```http
PATCH /api/progress/lessons/:id/progress
Authorization: Bearer {token}
Content-Type: application/json

{
  "watchTime": 30
}
```

---

### 8.3 Complete Lesson
```http
POST /api/progress/lessons/:id/complete
Authorization: Bearer {token}
```

**Validates 2/3 watch time rule**: Must watch at least `Math.ceil((duration * 2) / 3)` minutes

---

### 8.4 Get My Lesson Progress
```http
GET /api/progress/lessons?subjectId={uuid}
Authorization: Bearer {token}
```

---

## 9. Exam Taking

### 9.1 Start Exam
```http
POST /api/exams/:id/start
Authorization: Bearer {token}
```

**Checks:**
- Enrollment
- All lessons in subject completed
- Already passed (for required exams)

**Response:**
```json
{
  "message": "Exam started. Good luck! 🍀",
  "data": {
    "id": "exam_uuid",
    "name": "Python Final Exam",
    "duration": 90,
    "passingScore": 70,
    "questions": [
      {
        "id": "question_uuid",
        "question": "What is Python?",
        "type": "MULTIPLE_CHOICE",
        "options": ["A", "B", "C", "D"],
        "points": 2
      }
    ],
    "attemptId": "attempt_uuid",
    "startedAt": "2025-01-01T10:00:00.000Z"
  }
}
```

---

### 9.2 Submit Exam
```http
POST /api/exams/:id/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "attemptId": "uuid",
  "answers": {
    "question_uuid_1": "A",
    "question_uuid_2": "True",
    "question_uuid_3": "Answer text here"
  }
}
```

**Response:**
```json
{
  "message": "🎉 Congratulations! You passed!",
  "data": {
    "attemptId": "uuid",
    "score": 85,
    "totalScore": 17,
    "maxScore": 20,
    "passingScore": 70,
    "passed": true,
    "results": [
      {
        "questionId": "uuid",
        "question": "What is Python?",
        "userAnswer": "A",
        "correctAnswer": "A",
        "isCorrect": true,
        "points": 2,
        "maxPoints": 2
      }
    ]
  }
}
```

---

### 9.3 Get Exam Attempts
```http
GET /api/exams/:id/attempts
Authorization: Bearer {token}
```

---

### 9.4 Get Exam Result
```http
GET /api/exams/attempts/:attemptId/result
Authorization: Bearer {token}
```

---

## 10. Dashboard

### 10.1 Dashboard Overview
```http
GET /api/admin/dashboard/overview
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "enrolledMajors": 3,
    "completedLessons": 15,
    "passedExams": 5,
    "inProgressLessons": 2,
    "majors": [...],
    "recentActivities": [
      {
        "type": "lesson",
        "name": "Variables and Data Types",
        "subjectName": "Python Basics",
        "isCompleted": true,
        "timestamp": "2025-01-01T10:00:00.000Z"
      }
    ]
  }
}
```

---

### 10.2 Major Progress Detail
```http
GET /api/admin/dashboard/progress/:majorId
Authorization: Bearer {token}
```

**Response includes:**
- Subject-by-subject progress
- Locked/unlocked lessons
- Exam attempts and best scores
- Next lessons to complete

---

## 11. Blog

### 11.1 Create Blog Post
```http
POST /api/blog
Authorization: Bearer {token}
Content-Type: multipart/form-data

blogImage: [file]
title: My First Blog Post
content: This is the content...
excerpt: Short description
tags: ["programming", "python"]
```

---

### 11.2 List Blog Posts
```http
GET /api/blog?page=1&limit=10&authorId={uuid}&tag=python&search=tutorial
```

---

### 11.3 Get Blog Post Detail
```http
GET /api/blog/:id
```

**Response includes comments**

---

### 11.4 Update Blog Post
```http
PATCH /api/blog/:id
Authorization: Bearer {token}
Content-Type: multipart/form-data

title: Updated Title
content: Updated content
```

---

### 11.5 Delete Blog Post
```http
DELETE /api/blog/:id
Authorization: Bearer {token}
```

---

### 11.6 Add Comment
```http
POST /api/blog/:id/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Great post!"
}
```

---

### 11.7 Delete Comment
```http
DELETE /api/blog/comments/:id
Authorization: Bearer {token}
```

---

## 12. Q&A

### 12.1 Ask Question
```http
POST /api/questions
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "How to install Python?",
  "content": "I'm new to Python and need help...",
  "tags": ["python", "beginner"]
}
```

---

### 12.2 List Questions
```http
GET /api/questions?page=1&tag=python&search=install&sortBy=recent&hasAcceptedAnswer=true
```

**Sort Options:**
- `recent` - Recently asked
- `popular` - Most viewed
- `unanswered` - No answers yet

---

### 12.3 Get Question Detail
```http
GET /api/questions/:id
```

**Response includes:**
- Accepted answer (first)
- All answers (sorted)

---

### 12.4 Update Question
```http
PATCH /api/questions/:id
Authorization: Bearer {token}
```

---

### 12.5 Delete Question
```http
DELETE /api/questions/:id
Authorization: Bearer {token}
```

---

### 12.6 Post Answer
```http
POST /api/questions/:id/answers
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Here's how to install Python..."
}
```

---

### 12.7 Update Answer
```http
PATCH /api/questions/answers/:id
Authorization: Bearer {token}
```

---

### 12.8 Delete Answer
```http
DELETE /api/questions/answers/:id
Authorization: Bearer {token}
```

---

### 12.9 Accept Answer
```http
POST /api/questions/answers/:id/accept
Authorization: Bearer {token}
```

**Only question author can accept**

---

### 12.10 Unaccept Answer
```http
DELETE /api/questions/answers/:id/accept
Authorization: Bearer {token}
```

---

### 12.11 List Tags
```http
GET /api/questions/tags/list?search=python&limit=50
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "python",
      "blogPostCount": 25,
      "questionCount": 45,
      "totalUsage": 70
    }
  ]
}
```

---

## 13. Admin Statistics

### 13.1 Overview Stats
```http
GET /api/admin/stats/overview
Authorization: Bearer {admin_token}
```

**Returns:**
- User statistics (total, by status, new this week/month)
- Learning statistics (majors, subjects, lessons, exams, enrollments)
- Progress statistics (completed lessons, exam pass rate)
- Community statistics (blogs, questions, answers, comments)

---

### 13.2 User Stats
```http
GET /api/admin/stats/users?days=30
Authorization: Bearer {admin_token}
```

**Returns:**
- Status/role distribution
- User growth chart (daily registrations)
- Most active users (top 10)

---

### 13.3 Learning Stats
```http
GET /api/admin/stats/learning
Authorization: Bearer {admin_token}
```

**Returns:**
- Popular majors (by enrollments)
- Popular subjects
- Completion rates by major

---

### 13.4 Engagement Stats
```http
GET /api/admin/stats/engagement
Authorization: Bearer {admin_token}
```

**Returns:**
- Lesson engagement (start rate, completion rate, avg watch time)
- Exam engagement (pass rate, avg score, most attempted)
- Top lessons by completion rate

---

### 13.5 Community Stats
```http
GET /api/admin/stats/community?days=30
Authorization: Bearer {admin_token}
```

**Returns:**
- Blog statistics (posts, views, comments)
- Q&A statistics (questions, answers, resolved rate)
- Top contributors
- Most used tags
- Popular content

---

## 14. Admin Reports

### 14.1 User Report
```http
GET /api/admin/reports/users?status=ACTIVE&role=USER&registeredFrom=2025-01-01&hasEnrollments=true&format=json
Authorization: Bearer {admin_token}
```

**Format:** `json` or `csv`

**Filters:**
- `status`: PENDING | APPROVED | ACTIVE | DEACTIVE
- `role`: USER | ADMIN
- `registeredFrom`: Date
- `registeredTo`: Date
- `hasEnrollments`: true | false
- `hasCompletedLessons`: true | false

---

### 14.2 Progress Report
```http
GET /api/admin/reports/progress?majorId={uuid}&userId={uuid}&format=json
Authorization: Bearer {admin_token}
```

**Requires:** `majorId` OR `userId`

**Returns:**
- Detailed progress by subject
- Lesson completion details
- Exam results with best scores

---

### 14.3 Engagement Report
```http
GET /api/admin/reports/engagement?days=30&userId={uuid}&majorId={uuid}
Authorization: Bearer {admin_token}
```

**Returns:**
- Activity timeline (lessons, exams, blog, Q&A)
- Activity summary by type

---

## 15. Stream Chat

### 15.1 Generate Token
```http
POST /api/chat/token
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "token": "stream_user_token",
    "apiKey": "your_stream_api_key",
    "userId": "uuid",
    "userName": "John Doe",
    "userImage": "/uploads/avatars/avatar.jpg"
  }
}
```

---

### 15.2 Create Channel
```http
POST /api/chat/channels
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "messaging",
  "id": "general-chat",
  "name": "General Discussion",
  "members": ["user_id_1", "user_id_2"]
}
```

**Channel Types:**
- `messaging` - Direct messages
- `team` - Group discussions
- `livestream` - Live events
- `commerce` - Customer support

---

### 15.3 Get User's Channels
```http
GET /api/chat/channels?type=messaging&limit=20&offset=0
Authorization: Bearer {token}
```

---

### 15.4 Delete Channel (Admin)
```http
DELETE /api/chat/channels/:type/:id
Authorization: Bearer {admin_token}
```

---

### 15.5 Create Direct Message
```http
POST /api/chat/dm
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientId": "user_uuid"
}
```

---

### 15.6 Create Subject Channel
```http
POST /api/chat/channels/subject/:subjectId
Authorization: Bearer {token}
```

**Checks enrollment and adds all enrolled users**

---

### 15.7 Add Members
```http
POST /api/chat/channels/:type/:id/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "userIds": ["user_id_1", "user_id_2"]
}
```

---

### 15.8 Remove Members
```http
DELETE /api/chat/channels/:type/:id/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "userIds": ["user_id_1"]
}
```

---

## 🔐 Authentication

All protected endpoints require JWT token in header:

```http
Authorization: Bearer {your_jwt_token}
```

Get token from `/api/auth/login` or `/api/auth/register`

---

## 📊 Response Format

### Success Response
```json
{
  "message": "Success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

### Paginated Response
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## 🚀 Quick Start

1. **Register & Login**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

2. **Browse Majors**
```bash
curl http://localhost:8000/api/majors
```

3. **Enroll in Major**
```bash
curl -X POST http://localhost:8000/api/enrollments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"majorId":"major_uuid"}'
```

4. **Start Learning**
```bash
# Start lesson
curl -X POST http://localhost:8000/api/progress/lessons/{lesson_id}/start \
  -H "Authorization: Bearer {token}"

# Update progress
curl -X PATCH http://localhost:8000/api/progress/lessons/{lesson_id}/progress \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"watchTime":30}'

# Complete lesson
curl -X POST http://localhost:8000/api/progress/lessons/{lesson_id}/complete \
  -H "Authorization: Bearer {token}"
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- All IDs are UUIDs
- File uploads use `multipart/form-data`
- Search is case-insensitive
- Pagination starts at page 1
- Default limit is 20 items per page

---

**Last Updated:** November 10, 2025  
**API Version:** 1.0  
**Total Endpoints:** 81
