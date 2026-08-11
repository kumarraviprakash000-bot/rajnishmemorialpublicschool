# Rajnish Connect

Build a modern, professional, responsive school management web app/PWA for Rajnish Memorial Public School.

The app should be designed for real-world school use and should have a clean, simple, trustworthy interface that works well on desktop, tablet, and mobile.

1. User Roles

Create three main roles with role-based access:

Admin

Teacher

Parent

Each user must only see the features and data allowed for their role.

2. Admin Dashboard

Create a professional Admin Dashboard with summary cards:

Total Students

Total Teachers

Total Fee Collected

Total Fee Pending

Students With Pending Fees

Today's Attendance

New Notices

Show useful charts/reports for:

Monthly fee collection

Pending fees by class

Attendance overview

Recent payments

Recent notices

The dashboard should be clean and easy for a school administrator to understand at a glance.

3. Student Management

Admin can:

Add student

Edit student

Delete/deactivate student

Search student

Filter by class/section

View complete student profile

Student profile should contain:

Student name

Admission number

Class

Section

Date of birth

Parent/guardian name

Parent mobile number

Parent email

Address

Student photo

Attendance summary

Fee summary

Academic results

Allow importing students through CSV/Excel if practical.

4. Fee Management — MOST IMPORTANT FEATURE

Build a complete fee management system.

Admin should be able to:

Create fee structures by class

Set tuition fee

Set annual fee

Set transport fee

Set other fees

Set due dates

Add late fees

Record payments

Edit payment records with proper permissions

Generate fee receipts

View payment history

Search and filter pending fees

Create a clear fee dashboard showing:

Total fee expected

Total collected

Total pending

Number of students with pending fees

Each student must have a fee status:

🟢 PAID
🟡 PARTIALLY PAID
🔴 DUE

5. Parent Fee View

Parents must be able to log in and immediately see their child's fee status.

Show:

Total fee

Amount paid

Amount pending

Due date

Late fee, if applicable

Payment history

Previous receipts

Example:

Student: Rahul Kumar
Class: 5-A

Total Fee: ₹35,000
Paid: ₹25,000
Pending: ₹10,000
Status: 🔴 Fee Due

Add a View/Download Receipt option.

If the full fee is paid, clearly show:

🟢 Fee Paid

If partially paid:

🟡 Partially Paid

If payment is pending:

🔴 Fee Due

6. One-Click Fee Reminder System

This is a very important Admin feature.

Create a button:

📲 Send Fee Reminders

When Admin clicks it, show:

Number of students with pending fees

Total pending amount

List of parents who will receive the reminder

Then show confirmation:

"Send fee reminders to 120 parents?"

Buttons:

Cancel
Send Reminders

After confirmation, send the configured reminder through available communication services such as SMS and Email.

The message should automatically contain:

School name

Student name

Class

Pending fee amount

Due date

Payment instructions/link if available

Example message:

"Rajnish Memorial Public School: Dear Parent, ₹10,000 fee is pending for Rahul Kumar, Class 5-A. Please clear the outstanding fee by the due date. Thank you."

Maintain a communication log showing:

Parent

Student

Channel

Date/time

Sent/failed status

IMPORTANT:
Do not fake SMS, email, WhatsApp, or payment integrations. Build proper integration points and environment-variable configuration for real providers.

7. Notice Board

Create a prominent 📢 Notice Board.

Admin can create notices with:

Notice title

Notice description

Date

Expiry date

Important/Priority flag

Attachment such as PDF/image

Target audience:

Everyone

Parents

Teachers

Specific class/section

Important notices should appear at the top.

Example:

📢 IMPORTANT NOTICE

"Due to heavy rain, the school will remain closed on 15 August. School will reopen on 16 August."

Parents and teachers should see new notices on their dashboard.

Add notification indicators for new notices.

8. Teacher Dashboard

Teachers should have a simple dashboard.

Features:

My Classes

Student List

Attendance

Homework

Marks/Results

Notices

School Calendar

Teachers should only be able to access students/classes assigned to them.

9. Attendance

Teachers can mark daily attendance.

For each class:

Present

Absent

Late

Parents can view their child's attendance.

Show:

Today's attendance

Monthly attendance

Attendance percentage

Attendance history

Admin can view attendance reports class-wise and student-wise.

10. Homework

Teachers can create homework:

Subject

Homework title

Description

Date

Due date

Attachment

Parents/students can view homework from their dashboard.

11. Exams & Results

Admin/teachers can manage:

Exams

Subjects

Marks

Grades

Results

Parents can view their child's result/report card.

Create a clean report-card style screen.

12. School Calendar

Create a calendar for:

Holidays

Exams

Events

Parent meetings

Important school dates

Admin can create/edit/delete calendar events.

13. Notifications

Create a notification system for:

New notice

Fee reminder

Fee payment confirmation

Homework

Attendance alerts

Exam/result publication

Important school announcements

Use in-app notifications and provide integration points for SMS/email/push notifications.

14. Parent Dashboard

The Parent Dashboard should be extremely simple.

At the top show:

Welcome, Parent

Then display the child's:

Name

Class

Photo

Attendance

Fee status

Pending amount

Latest notices

Homework

Results

Upcoming events

Make the Fee Status and Important Notices highly visible.

15. Authentication & Security

Implement secure authentication.

Use role-based access control.

Admin:

Full school management access

Teacher:

Only assigned classes/students

Parent:

Only their own child's information

Parents must never be able to see another student's fees, attendance, results, or personal information.

Use proper database security and row-level access policies where supported.

Do not expose sensitive data in the frontend.

16. Database

Create a proper relational database structure.

Suggested entities:

users

roles

students

parents

teachers

classes

sections

fee_structures

student_fees

payments

payment_receipts

notices

notice_targets

attendance

homework

exams

subjects

marks

calendar_events

notifications

communication_logs

Create proper relationships and timestamps.

Use realistic seed/demo data so the application can be tested immediately.

17. UI/UX

Design should look like a modern professional school application.

School name:

RAJNISH MEMORIAL PUBLIC SCHOOL

Use a clean education-focused design.

Requirements:

Responsive

Mobile-first

Fast

Clean navigation

Clear cards and tables

Professional typography

Accessible buttons

Good empty states

Loading states

Error states

Confirmation dialogs for destructive actions

Search/filter/sort wherever useful

Create a sidebar navigation for Admin and Teacher.

Create a simple bottom/tab navigation or mobile-friendly navigation for Parents.

Do not overcrowd the interface.

18. Admin Navigation

Create:

Dashboard
Students
Teachers
Classes
Fees
Payments
Fee Reminders
Notice Board
Attendance
Homework
Exams & Results
Calendar
Notifications
Reports
Settings

19. Parent Navigation

Create:

Home
My Child
Fees
Attendance
Homework
Results
Notice Board
Calendar
Notifications
Profile

20. Important Business Logic

Implement these rules:

When a payment is recorded, automatically update the student's outstanding fee.

When outstanding amount becomes zero, status becomes PAID.

If some amount remains, status becomes PARTIALLY PAID.

If no required payment has been made by the due date, status becomes DUE.

Calculate late fees according to the configured fee rules.

Generate a unique receipt number for every payment.

Every payment should have a timestamp and payment history.

Fee reminder lists should automatically include only students with outstanding fees.

Admin should be able to filter pending fees by class, section, due date, and amount.

Important notices should appear prominently on parent dashboards.

Parents can only access their own child's data.

Teachers can only access their assigned classes.

21. Reports

Create downloadable/printable reports for:

Fee collection

Pending fees

Student-wise fee statement

Class-wise fee statement

Payment history

Attendance

Exam results

Where practical, provide CSV/PDF export.

22. Settings

Admin settings should include:

School name

School logo

Address

Contact information

Fee settings

Late fee rules

Notification settings

SMS provider configuration

Email provider configuration

Payment gateway configuration

Academic year

Classes and sections

Use environment variables/secrets for API keys.

Never hard-code API credentials.

23. Demo/Test Mode

Create demo accounts for:

Admin
Teacher
Parent

Populate the database with realistic demo students, fees, payments, notices, attendance, homework and results.

The application should be usable immediately after setup.

24. Final Quality Requirements

Before considering the project complete:

Make all major buttons functional.

Avoid placeholder pages wherever possible.

Do not create fake integrations.

Validate forms.

Handle errors gracefully.

Make tables responsive.

Make the fee workflow fully functional.

Make Parent Fee Status fully functional.

Make Notice Board fully functional.

Make Admin Fee Reminder workflow functional up to the configured SMS/email integration layer.

Keep the code modular and maintainable.

Make the application production-ready in structure.

Most importantly, prioritize reliability of the Fee Management and Notice Board features, because these are the school's most important requirements.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rajnishmemorialpublicschool.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a05fe645-15b2-48a7-a696-7ad1e46a5c57).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
