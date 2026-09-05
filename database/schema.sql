-- CampusFlow Relational PostgreSQL Database Schema DDL

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS faculty_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id INT NOT NULL REFERENCES departments(id),
    employee_id VARCHAR(100) UNIQUE NOT NULL,
    designation VARCHAR(100) NOT NULL,
    office_hours VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS student_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id INT NOT NULL REFERENCES departments(id),
    roll_number VARCHAR(100) UNIQUE NOT NULL,
    semester_number INT DEFAULT 1,
    gpa FLOAT DEFAULT 3.5,
    target_gpa FLOAT DEFAULT 3.8,
    cohort_year INT DEFAULT 2024
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    department_id INT NOT NULL REFERENCES departments(id),
    credits INT DEFAULT 4,
    semester_number INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS course_faculty (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id INT NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) DEFAULT '2025-2026'
);

CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    semester INT DEFAULT 1,
    grade VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    marked_by INT REFERENCES faculty_profiles(id)
);

CREATE TABLE IF NOT EXISTS internal_marks (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    score FLOAT NOT NULL,
    max_score FLOAT DEFAULT 100.0,
    weightage FLOAT DEFAULT 20.0
);

CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP NOT NULL,
    max_score FLOAT DEFAULT 100.0,
    created_by INT NOT NULL REFERENCES faculty_profiles(id)
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    submission_text TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score FLOAT,
    feedback TEXT,
    status VARCHAR(50) DEFAULT 'submitted'
);

CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    exam_date TIMESTAMP NOT NULL,
    duration_minutes INT DEFAULT 180,
    max_score FLOAT DEFAULT 100.0,
    room VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS timetables (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    room VARCHAR(100) NOT NULL,
    faculty_id INT REFERENCES faculty_profiles(id)
);

CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(50) DEFAULT 'all',
    department_id INT REFERENCES departments(id),
    author_id INT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_plans (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    exam_title VARCHAR(255) NOT NULL,
    plan_data_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_predictions (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    risk_level VARCHAR(50) NOT NULL,
    risk_score FLOAT NOT NULL,
    key_factors_json JSONB NOT NULL,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
