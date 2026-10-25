# Magični Svijet — Kindergarten Web Application

## Project Description
A full-stack, single-phase web application designed for managing kindergarten operations, programs, children enrollments, and parent communications.

## Milestone 1 Status
The application has three types of users. Guests can explore the kindergarten, its classes and contact information. Parents can manage their profile and children, apply for classes and track the status of their applications. Administrators manage all content and approve or reject applications.

Additionally for Milestone 1:
- **Repository Setup:** Standardized directory hierarchy initialized for backend and frontend separation.
- **Frontend:** Static Single-Page Application (SPA) structure constructed with HTML5, CSS, and Bootstrap views.
- **Database Planning:** Entity-Relationship Diagram (ERD) designed and saved to `docs/erd.png` for 5 core entities.


## Entities & Relationships (Database Schema)
The database schema consists of **5 interconnected core entities** based on the ERD:

1. **USERS (`UserID`)**
   - Stores user accounts, credentials, and permissions.
   - **Attributes:** `FirstName`, `LastName`, `Email`, `Phone`, `PasswordHash`, `Role` (`admin`, `parent`, `teacher`), `CreatedAt`.
   - **Relationships:** One-to-Many with `CHILDREN`.

2. **CHILDREN (`ChildID`)**
   - Manages children registered in the system.
   - **Attributes:** `ParentID` (FK), `FirstName`, `LastName`, `DateOfBirth`, `Notes`, `CreatedAt`.
   - **Relationships:** Belongs to a `USER` (Parent); One-to-Many with `ENROLLMENTS`.

3. **PROGRAMS (`ProgramID`)**
   - Defines educational programs and age-group classes offered by the kindergarten.
   - **Attributes:** `Name`, `MinAge`, `MaxAge`, `Description`, `Schedule`, `Price`, `Capacity`, `Teacher`, `Image`.
   - **Relationships:** One-to-Many with `ENROLLMENTS` and optional One-to-Many with `EVENTS`.

4. **ENROLLMENTS (`EnrollmentID`)**
   - Junction entity tracking program applications and child enrollments.
   - **Attributes:** `ChildID` (FK), `ProgramID` (FK), `Status` (`pending`, `approved`, `active`, `rejected`), `StartDate`, `Notes`, `CreatedAt`.
   - **Relationships:** Links a `CHILD` to a `PROGRAM`.

5. **EVENTS (`EventID`)**
   - Manages kindergarten activities, outings, and special events.
   - **Attributes:** `ProgramID` (FK, nullable), `Title`, `Description`, `EventDate`, `Location`.
   - **Relationships:** Optionally linked to a specific `PROGRAM`.


## Entity-Relationship Diagram (ERD)
The draft ERD diagram is stored in the project repository at `docs/erd.png`.

## External API Integration (Planned)
- **Feature:** OpenWeatherMap API integration.
- **Usage:** Displays real-time local weather conditions to show optimal outdoor play conditions for kindergarten activities.