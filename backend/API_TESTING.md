# 🧪 API Testing Guide

**Complete Postman Collection Guide for Learning Platform API**

---

## 📋 Table of Contents

1. [Setup](#setup)
2. [Environment Variables](#environment-variables)
3. [Pre-request Scripts](#pre-request-scripts)
4. [Test Scripts](#test-scripts)
5. [Testing Scenarios](#testing-scenarios)
6. [Postman Collection Structure](#postman-collection-structure)
7. [Common Test Cases](#common-test-cases)
8. [Error Testing](#error-testing)

---

## Setup

### Install Postman
Download from: https://www.postman.com/downloads/

### Import Collection

Create a new collection named **"Learning Platform API"** with these folders:

```
Learning Platform API/
├── 1. Authentication
├── 2. User Management
├── 3. Major Management
├── 4. Subject Management
├── 5. Lesson Management
├── 6. Exam Management
├── 7. Enrollment
├── 8. Learning Progress
├── 9. Exam Taking
├── 10. Dashboard
├── 11. Blog
├── 12. Q&A
├── 13. Admin Statistics
├── 14. Admin Reports
└── 15. Stream Chat
```

---

## Environment Variables

### Create Environment: "Learning Platform - Local"

```javascript
{
  "API_URL": "http://localhost:8000/api",
  "USER_TOKEN": "",
  "ADMIN_TOKEN": "",
  "USER_ID": "",
  "ADMIN_ID": "",
  "TEST_MAJOR_ID": "",
  "TEST_SUBJECT_ID": "",
  "TEST_LESSON_ID": "",
  "TEST_EXAM_ID": "",
  "TEST_ENROLLMENT_ID": "",
  "TEST_BLOG_ID": "",
  "TEST_QUESTION_ID": "",
  "TEST_ANSWER_ID": "",
  "ATTEMPT_ID": "",
  "CHANNEL_ID": "",
  "STREAM_TOKEN": ""
}
```

---

## Pre-request Scripts

### Collection-level Pre-request Script

Add this to the **Collection Settings → Pre-request Scripts**:

```javascript
// Auto-refresh token if expired (optional)
const token = pm.environment.get('USER_TOKEN');
if (token) {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const expiry = payload.exp * 1000;
        const now = Date.now();
        
        if (expiry < now) {
            console.log('Token expired, please login again');
        }
    }
}

// Log request details
console.log(`${pm.request.method} ${pm.request.url}`);
```

---

## Test Scripts

### Collection-level Test Scripts

Add this to **Collection Settings → Tests**:

```javascript
// Check response time
pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

// Check status code
pm.test("Status code is successful", function () {
    pm.response.to.have.status(200);
});

// Parse response
if (pm.response.code === 200) {
    try {
        const jsonData = pm.response.json();
        
        // Auto-save tokens
        if (jsonData.data && jsonData.data.token) {
            const user = jsonData.data.user;
            if (user.role === 'ADMIN') {
                pm.environment.set('ADMIN_TOKEN', jsonData.data.token);
                pm.environment.set('ADMIN_ID', user.id);
                console.log('✅ Admin token saved');
            } else {
                pm.environment.set('USER_TOKEN', jsonData.data.token);
                pm.environment.set('USER_ID', user.id);
                console.log('✅ User token saved');
            }
        }
        
        // Auto-save IDs from response
        if (jsonData.data && jsonData.data.id) {
            const requestName = pm.info.requestName;
            
            if (requestName.includes('Major')) {
                pm.environment.set('TEST_MAJOR_ID', jsonData.data.id);
            } else if (requestName.includes('Subject')) {
                pm.environment.set('TEST_SUBJECT_ID', jsonData.data.id);
            } else if (requestName.includes('Lesson')) {
                pm.environment.set('TEST_LESSON_ID', jsonData.data.id);
            } else if (requestName.includes('Exam')) {
                pm.environment.set('TEST_EXAM_ID', jsonData.data.id);
            } else if (requestName.includes('Enrollment')) {
                pm.environment.set('TEST_ENROLLMENT_ID', jsonData.data.id);
            } else if (requestName.includes('Blog')) {
                pm.environment.set('TEST_BLOG_ID', jsonData.data.id);
            } else if (requestName.includes('Question')) {
                pm.environment.set('TEST_QUESTION_ID', jsonData.data.id);
            }
        }
        
    } catch (e) {
        console.log('Response parsing error:', e);
    }
}
```

---

## Testing Scenarios

### Scenario 1: User Registration & Login Flow

#### 1.1 Register New User
```http
POST {{API_URL}}/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "testuser{{$timestamp}}@example.com",
  "password": "Test@123456",
  "phone": "0123456789"
}
```

**Tests:**
```javascript
pm.test("User registered successfully", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.user.status).to.eql('PENDING');
    pm.expect(jsonData.data.user.role).to.eql('USER');
    pm.environment.set('PENDING_USER_ID', jsonData.data.user.id);
});
```

---

#### 1.2 Login as Admin
```http
POST {{API_URL}}/auth/login
Content-Type: application/json

{
  "email": "admin@learning.com",
  "password": "Admin123"
}
```

**Tests:**
```javascript
pm.test("Admin login successful", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.user.role).to.eql('ADMIN');
    pm.environment.set('ADMIN_TOKEN', jsonData.data.token);
});
```

---

#### 1.3 Approve User
```http
PATCH {{API_URL}}/users/{{PENDING_USER_ID}}/approve
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

#### 1.4 Update Status to ACTIVE
```http
PATCH {{API_URL}}/users/{{PENDING_USER_ID}}/status
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "status": "ACTIVE"
}
```

---

#### 1.5 Login as User
```http
POST {{API_URL}}/auth/login
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "Test@123456"
}
```

---

### Scenario 2: Complete Learning Flow

#### 2.1 Browse Majors
```http
GET {{API_URL}}/majors
```

**Tests:**
```javascript
pm.test("Majors list returned", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
    pm.expect(jsonData.data.length).to.be.above(0);
    
    // Save first major ID
    if (jsonData.data.length > 0) {
        pm.environment.set('TEST_MAJOR_ID', jsonData.data[0].id);
    }
});
```

---

#### 2.2 Get Major Detail
```http
GET {{API_URL}}/majors/{{TEST_MAJOR_ID}}
```

**Tests:**
```javascript
pm.test("Major has subjects", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.subjects).to.be.an('array');
    
    // Save first subject ID
    if (jsonData.data.subjects.length > 0) {
        pm.environment.set('TEST_SUBJECT_ID', jsonData.data.subjects[0].id);
    }
});
```

---

#### 2.3 Enroll in Major
```http
POST {{API_URL}}/enrollments
Authorization: Bearer {{USER_TOKEN}}
Content-Type: application/json

{
  "majorId": "{{TEST_MAJOR_ID}}"
}
```

**Tests:**
```javascript
pm.test("Enrollment created", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.status).to.eql('ACTIVE');
    pm.environment.set('TEST_ENROLLMENT_ID', jsonData.data.id);
});
```

---

#### 2.4 Get Subject Detail
```http
GET {{API_URL}}/subjects/{{TEST_SUBJECT_ID}}
Authorization: Bearer {{USER_TOKEN}}
```

**Tests:**
```javascript
pm.test("Subject has lessons", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.lessons).to.be.an('array');
    
    // Save first lesson ID
    if (jsonData.data.lessons.length > 0) {
        pm.environment.set('TEST_LESSON_ID', jsonData.data.lessons[0].id);
    }
});
```

---

#### 2.5 Start Lesson
```http
POST {{API_URL}}/progress/lessons/{{TEST_LESSON_ID}}/start
Authorization: Bearer {{USER_TOKEN}}
```

---

#### 2.6 Update Watch Time
```http
PATCH {{API_URL}}/progress/lessons/{{TEST_LESSON_ID}}/progress
Authorization: Bearer {{USER_TOKEN}}
Content-Type: application/json

{
  "watchTime": 30
}
```

---

#### 2.7 Complete Lesson
```http
POST {{API_URL}}/progress/lessons/{{TEST_LESSON_ID}}/complete
Authorization: Bearer {{USER_TOKEN}}
```

**Tests:**
```javascript
pm.test("Lesson completed successfully", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.isCompleted).to.be.true;
    pm.expect(jsonData.data.completedAt).to.not.be.null;
});
```

---

#### 2.8 Check Dashboard
```http
GET {{API_URL}}/admin/dashboard/overview
Authorization: Bearer {{USER_TOKEN}}
```

**Tests:**
```javascript
pm.test("Dashboard shows progress", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.completedLessons).to.be.above(0);
    pm.expect(jsonData.data.enrolledMajors).to.be.above(0);
});
```

---

### Scenario 3: Exam Taking Flow

#### 3.1 Get Subject Exams
```http
GET {{API_URL}}/subjects/{{TEST_SUBJECT_ID}}
Authorization: Bearer {{USER_TOKEN}}
```

**Tests:**
```javascript
pm.test("Subject has exams", function () {
    const jsonData = pm.response.json();
    if (jsonData.data.exams && jsonData.data.exams.length > 0) {
        pm.environment.set('TEST_EXAM_ID', jsonData.data.exams[0].id);
    }
});
```

---

#### 3.2 Start Exam
```http
POST {{API_URL}}/exams/{{TEST_EXAM_ID}}/start
Authorization: Bearer {{USER_TOKEN}}
```

**Tests:**
```javascript
pm.test("Exam started", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.attemptId).to.exist;
    pm.expect(jsonData.data.questions).to.be.an('array');
    
    pm.environment.set('ATTEMPT_ID', jsonData.data.attemptId);
    
    // Generate sample answers
    const answers = {};
    jsonData.data.questions.forEach(q => {
        if (q.type === 'MULTIPLE_CHOICE') {
            answers[q.id] = 'A'; // First option
        } else if (q.type === 'TRUE_FALSE') {
            answers[q.id] = 'True';
        } else {
            answers[q.id] = 'Sample answer';
        }
    });
    pm.environment.set('EXAM_ANSWERS', JSON.stringify(answers));
});
```

---

#### 3.3 Submit Exam
```http
POST {{API_URL}}/exams/{{TEST_EXAM_ID}}/submit
Authorization: Bearer {{USER_TOKEN}}
Content-Type: application/json

{
  "attemptId": "{{ATTEMPT_ID}}",
  "answers": {{EXAM_ANSWERS}}
}
```

**Tests:**
```javascript
pm.test("Exam submitted and graded", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.score).to.exist;
    pm.expect(jsonData.data.passed).to.be.a('boolean');
    pm.expect(jsonData.data.results).to.be.an('array');
});
```

---

#### 3.4 Get Exam Result
```http
GET {{API_URL}}/exams/attempts/{{ATTEMPT_ID}}/result
Authorization: Bearer {{USER_TOKEN}}
```

---

### Scenario 4: Community Interaction

#### 4.1 Create Blog Post
```http
POST {{API_URL}}/blog
Authorization: Bearer {{USER_TOKEN}}
Content-Type: application/json

{
  "title": "My Learning Journey with Python",
  "content": "Today I completed my first Python lesson...",
  "excerpt": "My experience learning Python",
  "tags": ["python", "learning", "beginner"]
}
```

**Tests:**
```javascript
pm.test("Blog post created", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.id).to.exist;
    pm.environment.set('TEST_BLOG_ID', jsonData.data.id);
});
```

---

#### 4.2 Add Comment
```http
POST {{API_URL}}/blog/{{TEST_BLOG_ID}}/comments
Authorization: Bearer {{USER_TOKEN}}
Content-Type: application/json

{
  "content": "Great post! Keep learning! 🚀"
}
```

---

#### 4.3 Ask Question
```http
POST {{API_URL}}/questions
Authorization: Bearer {{USER_TOKEN}}
Content-Type: application/json

{
  "title": "How to handle exceptions in Python?",
  "content": "I'm struggling with try-except blocks. Can someone explain?",
  "tags": ["python", "exceptions", "help"]
}
```

**Tests:**
```javascript
pm.test("Question created", function () {
    const jsonData = pm.response.json();
    pm.environment.set('TEST_QUESTION_ID', jsonData.data.id);
});
```

---

#### 4.4 Post Answer
```http
POST {{API_URL}}/questions/{{TEST_QUESTION_ID}}/answers
Authorization: Bearer {{USER_TOKEN}}
Content-Type: application/json

{
  "content": "Use try-except like this:\n\ntry:\n    # your code\nexcept Exception as e:\n    print(e)"
}
```

**Tests:**
```javascript
pm.test("Answer posted", function () {
    const jsonData = pm.response.json();
    pm.environment.set('TEST_ANSWER_ID', jsonData.data.id);
});
```

---

### Scenario 5: Stream Chat Integration

#### 5.1 Generate Chat Token
```http
POST {{API_URL}}/chat/token
Authorization: Bearer {{USER_TOKEN}}
```

**Tests:**
```javascript
pm.test("Chat token generated", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.token).to.exist;
    pm.expect(jsonData.data.apiKey).to.exist;
    pm.environment.set('STREAM_TOKEN', jsonData.data.token);
});
```

---

#### 5.2 Create Direct Message
```http
POST {{API_URL}}/chat/dm
Authorization: Bearer {{USER_TOKEN}}
Content-Type: application/json

{
  "recipientId": "{{ADMIN_ID}}"
}
```

**Tests:**
```javascript
pm.test("DM channel created", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.channel).to.exist;
    pm.environment.set('CHANNEL_ID', jsonData.data.channel.id);
});
```

---

#### 5.3 Create Subject Channel
```http
POST {{API_URL}}/chat/channels/subject/{{TEST_SUBJECT_ID}}
Authorization: Bearer {{USER_TOKEN}}
```

---

#### 5.4 Get User Channels
```http
GET {{API_URL}}/chat/channels
Authorization: Bearer {{USER_TOKEN}}
```

**Tests:**
```javascript
pm.test("User has channels", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
});
```

---

### Scenario 6: Admin Analytics

#### 6.1 Overview Statistics
```http
GET {{API_URL}}/admin/stats/overview
Authorization: Bearer {{ADMIN_TOKEN}}
```

**Tests:**
```javascript
pm.test("Statistics returned", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.users).to.exist;
    pm.expect(jsonData.data.learning).to.exist;
    pm.expect(jsonData.data.progress).to.exist;
    pm.expect(jsonData.data.community).to.exist;
});
```

---

#### 6.2 User Statistics
```http
GET {{API_URL}}/admin/stats/users?days=30
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

#### 6.3 Export User Report (JSON)
```http
GET {{API_URL}}/admin/reports/users?format=json&status=ACTIVE
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

#### 6.4 Export User Report (CSV)
```http
GET {{API_URL}}/admin/reports/users?format=csv&status=ACTIVE
Authorization: Bearer {{ADMIN_TOKEN}}
```

**Tests:**
```javascript
pm.test("CSV file returned", function () {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('text/csv');
});
```

---

## Common Test Cases

### Test: Response Structure
```javascript
pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('data');
});
```

---

### Test: Pagination
```javascript
pm.test("Pagination exists", function () {
    const jsonData = pm.response.json();
    if (jsonData.pagination) {
        pm.expect(jsonData.pagination).to.have.property('total');
        pm.expect(jsonData.pagination).to.have.property('page');
        pm.expect(jsonData.pagination).to.have.property('limit');
        pm.expect(jsonData.pagination).to.have.property('totalPages');
    }
});
```

---

### Test: Authentication
```javascript
pm.test("Requires authentication", function () {
    if (!pm.request.headers.has('Authorization')) {
        pm.expect(pm.response.code).to.be.oneOf([401, 403]);
    }
});
```

---

### Test: Admin Permission
```javascript
pm.test("Admin only endpoint", function () {
    const jsonData = pm.response.json();
    if (pm.response.code === 403) {
        pm.expect(jsonData.message).to.include('Admin');
    }
});
```

---

## Error Testing

### Test: Validation Errors
```http
POST {{API_URL}}/auth/register
Content-Type: application/json

{
  "name": "",
  "email": "invalid-email",
  "password": "123"
}
```

**Expected:** 400 Bad Request

---

### Test: Unauthorized Access
```http
GET {{API_URL}}/admin/stats/overview
```

**Expected:** 401 Unauthorized

---

### Test: Forbidden Access
```http
DELETE {{API_URL}}/users/{{USER_ID}}
Authorization: Bearer {{USER_TOKEN}}
```

**Expected:** 403 Forbidden (only admin can delete)

---

### Test: Resource Not Found
```http
GET {{API_URL}}/majors/00000000-0000-0000-0000-000000000000
```

**Expected:** 404 Not Found

---

### Test: Duplicate Entry
```http
POST {{API_URL}}/auth/register
Content-Type: application/json

{
  "name": "Test",
  "email": "admin@learning.com",
  "password": "Test@123"
}
```

**Expected:** 409 Conflict

---

### Test: Prerequisite Not Met
```http
POST {{API_URL}}/progress/lessons/{{LOCKED_LESSON_ID}}/start
Authorization: Bearer {{USER_TOKEN}}
```

**Expected:** 400 Bad Request with prerequisite message

---

## Postman Collection Structure

```json
{
  "info": {
    "name": "Learning Platform API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{USER_TOKEN}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "API_URL",
      "value": "http://localhost:8000/api"
    }
  ]
}
```

---

## Running Tests

### Run Entire Collection
1. Click **Runner** button
2. Select **Learning Platform API** collection
3. Select environment: **Learning Platform - Local**
4. Click **Run Learning Platform API**

---

### Run Specific Folder
1. Right-click folder (e.g., "1. Authentication")
2. Select **Run folder**
3. View results

---

### Command Line (Newman)

Install Newman:
```bash
npm install -g newman
```

Run collection:
```bash
newman run "Learning_Platform_API.postman_collection.json" \
  -e "Learning_Platform_Local.postman_environment.json" \
  -r cli,json,html
```

---

## Test Automation Tips

### 1. Chain Requests
Use environment variables to chain requests:
- Register → Login → Get Token → Use Token

### 2. Dynamic Data
Use Postman variables:
```javascript
{
  "email": "user{{$timestamp}}@example.com",
  "name": "User {{$randomFirstName}}"
}
```

### 3. Clean Up
Add cleanup requests at end of tests:
```http
DELETE {{API_URL}}/users/{{TEST_USER_ID}}
DELETE {{API_URL}}/blog/{{TEST_BLOG_ID}}
```

### 4. Performance Testing
Add to Tests tab:
```javascript
pm.test("Response time < 500ms", () => {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Start Backend
        run: |
          cd backend
          npm install
          npm start &
          sleep 10
      
      - name: Run Newman Tests
        run: |
          npm install -g newman
          newman run postman/collection.json \
            -e postman/environment.json \
            --reporters cli,json
```

---

## Troubleshooting

### Token Expired
Re-run login request to get new token

### Environment Variable Not Set
Check if previous request succeeded and saved variable

### 500 Server Error
Check backend logs:
```bash
cd backend
npm run dev
```

### CORS Error
Update backend `.env`:
```
CORS_ORIGIN=http://localhost:3000,http://localhost:8000
```

---

## Best Practices

1. ✅ **Use environments** for different stages (Local, Dev, Staging, Prod)
2. ✅ **Save tokens automatically** in test scripts
3. ✅ **Chain related requests** using variables
4. ✅ **Test error cases** not just happy path
5. ✅ **Clean up test data** after test runs
6. ✅ **Use meaningful test names**
7. ✅ **Document special requirements** in request description
8. ✅ **Version control** collection and environment files
9. ✅ **Run tests before deployment**
10. ✅ **Monitor response times** for performance regression

---

**Last Updated:** November 10, 2025  
**Postman Version:** 10.x+  
**Newman Version:** 6.x+
