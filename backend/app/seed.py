from datetime import datetime, date, timedelta
import random
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.domain import (
    User, Department, FacultyProfile, StudentProfile, Course, CourseFaculty,
    Enrollment, Attendance, InternalMark, Assignment, AssignmentSubmission,
    Exam, Timetable, Announcement, Goal, StudyPlan, RiskPrediction
)
from app.services.risk_ml import risk_service

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        print("Seeding database with realistic synthetic data including Gujarati/Indian profiles...")

        # 1. Departments
        cse = Department(code="CSE", name="Computer Science & Engineering", description="Department of Computer Science & Software Systems")
        ce = Department(code="CE", name="Computer Engineering", description="Department of Computer Engineering & Systems")
        ece = Department(code="EC", name="Electronics & Communication", description="Department of Hardware, Signal Processing & Embedded Systems")
        it = Department(code="IT", name="Information Technology", description="Department of Information Systems & Web Engineering")
        ds = Department(code="DS", name="Data Science", description="Department of Data Science & Machine Learning")
        se = Department(code="SE", name="Software Engineering", description="Department of Software Engineering & Architecture")
        db.add_all([cse, ce, ece, it, ds, se])
        db.commit()

        # Passwords
        default_pwd = get_password_hash("password123")

        # 2. Admin User (Mihir Patel)
        admin_user = User(
            email="admin@campusflow.edu",
            password_hash=default_pwd,
            full_name="Mihir Patel (Admin)",
            role="admin",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
        )
        db.add(admin_user)

        # 3. Faculty Users & Profiles
        # Existing Demo Faculty
        f1_user = User(
            email="faculty@campusflow.edu",
            password_hash=default_pwd,
            full_name="Prof. Sarah Jenkins",
            role="faculty",
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80"
        )
        f2_user = User(
            email="faculty_ece@campusflow.edu",
            password_hash=default_pwd,
            full_name="Dr. Alan Turing",
            role="faculty",
            avatar_url="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80"
        )

        # New Indian / Gujarati Faculty
        f_rajesh_user = User(
            email="rajesh.patel@campusflow.edu",
            password_hash=default_pwd,
            full_name="Dr. Rajesh Patel",
            role="faculty",
            avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80"
        )
        f_neha_user = User(
            email="neha.shah@campusflow.edu",
            password_hash=default_pwd,
            full_name="Prof. Neha Shah",
            role="faculty",
            avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80"
        )
        f_amit_user = User(
            email="amit.desai@campusflow.edu",
            password_hash=default_pwd,
            full_name="Dr. Amit Desai",
            role="faculty",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80"
        )
        f_priya_user = User(
            email="priya.mehta@campusflow.edu",
            password_hash=default_pwd,
            full_name="Prof. Priya Mehta",
            role="faculty",
            avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80"
        )
        f_suresh_user = User(
            email="suresh.joshi@campusflow.edu",
            password_hash=default_pwd,
            full_name="Dr. Suresh Joshi",
            role="faculty",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80"
        )

        db.add_all([f1_user, f2_user, f_rajesh_user, f_neha_user, f_amit_user, f_priya_user, f_suresh_user])
        db.commit()

        f1_profile = FacultyProfile(user_id=f1_user.id, department_id=cse.id, employee_id="FAC-CSE-101", designation="Associate Professor", office_hours="Mon, Wed 2:00 PM - 4:00 PM (Lab 3B)")
        f2_profile = FacultyProfile(user_id=f2_user.id, department_id=ece.id, employee_id="FAC-ECE-101", designation="Professor", office_hours="Tue, Thu 10:00 AM - 12:00 PM (Room 402)")
        f_rajesh_profile = FacultyProfile(user_id=f_rajesh_user.id, department_id=cse.id, employee_id="FAC-CSE-102", designation="Professor & HOD", office_hours="Mon, Wed 10:00 AM - 12:00 PM (HOD Cabin)")
        f_neha_profile = FacultyProfile(user_id=f_neha_user.id, department_id=it.id, employee_id="FAC-IT-101", designation="Associate Professor", office_hours="Tue, Thu 2:00 PM - 4:00 PM (Lab IT-2)")
        f_amit_profile = FacultyProfile(user_id=f_amit_user.id, department_id=cse.id, employee_id="FAC-CSE-103", designation="Associate Professor", office_hours="Mon, Fri 11:00 AM - 1:00 PM (Room 305)")
        f_priya_profile = FacultyProfile(user_id=f_priya_user.id, department_id=cse.id, employee_id="FAC-CSE-104", designation="Assistant Professor", office_hours="Wed, Fri 3:00 PM - 5:00 PM (Lab DBMS)")
        f_suresh_profile = FacultyProfile(user_id=f_suresh_user.id, department_id=ece.id, employee_id="FAC-ECE-102", designation="Professor", office_hours="Tue, Thu 9:00 AM - 11:00 AM (Room ECE-4)")

        db.add_all([f1_profile, f2_profile, f_rajesh_profile, f_neha_profile, f_amit_profile, f_priya_profile, f_suresh_profile])
        db.commit()

        # 4. Courses (Semester 1 to 8 Catalog across Departments)
        # CSE Courses
        c_cse_s1_1 = Course(code="CS101", title="Programming in C & Problem Solving", department_id=cse.id, credits=4, semester_number=1)
        c_cse_s1_2 = Course(code="CS102", title="Engineering Mathematics - I", department_id=cse.id, credits=4, semester_number=1)
        c_cse_s1_3 = Course(code="CS103", title="Digital Logic & Systems", department_id=cse.id, credits=3, semester_number=1)

        c_cse_s2_1 = Course(code="CS104", title="Object Oriented Programming with C++", department_id=cse.id, credits=4, semester_number=2)
        c_cse_s2_2 = Course(code="CS105", title="Discrete Mathematics", department_id=cse.id, credits=3, semester_number=2)
        c_cse_s2_3 = Course(code="CS106", title="Data Structures & Algorithms", department_id=cse.id, credits=4, semester_number=2)

        c_cse_s3_1 = Course(code="CS201", title="Computer Organization & Architecture", department_id=cse.id, credits=4, semester_number=3)
        c_cse_s3_2 = Course(code="CS202", title="Design & Analysis of Algorithms", department_id=cse.id, credits=4, semester_number=3)
        c_cse_s3_3 = Course(code="CS203", title="Python Programming for Engineers", department_id=cse.id, credits=3, semester_number=3)

        c_cse_s4_1 = Course(code="CS204", title="Theory of Computation & Automata", department_id=cse.id, credits=4, semester_number=4)
        c_cse_s4_2 = Course(code="CS205", title="Microprocessors & Interfacing", department_id=cse.id, credits=3, semester_number=4)
        c_cse_s4_3 = Course(code="CS206", title="Advanced Java Programming", department_id=cse.id, credits=4, semester_number=4)

        c_os = Course(code="CS301", title="Operating Systems", department_id=cse.id, credits=4, semester_number=5)
        c_dbms = Course(code="CS302", title="Database Management Systems", department_id=cse.id, credits=4, semester_number=5)
        c_cn = Course(code="CS303", title="Computer Networks", department_id=cse.id, credits=3, semester_number=5)
        c_se = Course(code="CS304", title="Software Engineering", department_id=cse.id, credits=4, semester_number=5)
        c_ai = Course(code="CS305", title="Artificial Intelligence & ML", department_id=cse.id, credits=4, semester_number=5)

        c_cse_s6_1 = Course(code="CS306", title="Compiler Design", department_id=cse.id, credits=4, semester_number=6)
        c_cse_s6_2 = Course(code="CS307", title="Cloud Computing & DevOps", department_id=cse.id, credits=3, semester_number=6)
        c_cse_s6_3 = Course(code="CS308", title="Cyber Security & Cryptography", department_id=cse.id, credits=3, semester_number=6)

        c_cse_s7_1 = Course(code="CS401", title="Distributed Systems & Microservices", department_id=cse.id, credits=4, semester_number=7)
        c_cse_s7_2 = Course(code="CS402", title="Deep Learning & Neural Networks", department_id=cse.id, credits=4, semester_number=7)
        c_cse_s7_3 = Course(code="CS403", title="Blockchain & Web3 Technologies", department_id=cse.id, credits=3, semester_number=7)

        c_cse_s8_1 = Course(code="CS404", title="Major Capstone Engineering Project", department_id=cse.id, credits=8, semester_number=8)
        c_cse_s8_2 = Course(code="CS405", title="Industry Internship & Research Viva", department_id=cse.id, credits=6, semester_number=8)

        # IT Courses
        c_it_s1 = Course(code="IT101", title="Fundamentals of Web Development", department_id=it.id, credits=3, semester_number=1)
        c_it_s3 = Course(code="IT201", title="Object Oriented Systems Design", department_id=it.id, credits=4, semester_number=3)
        c_web = Course(code="IT301", title="Web Technologies & APIs", department_id=it.id, credits=3, semester_number=5)
        c_ds = Course(code="IT302", title="Data Science & Analytics", department_id=it.id, credits=4, semester_number=5)
        c_it_s7 = Course(code="IT401", title="Big Data Engineering & Pipelines", department_id=it.id, credits=4, semester_number=7)

        # ECE Courses
        c_ece_s1 = Course(code="EC101", title="Basic Electrical & Electronics", department_id=ece.id, credits=3, semester_number=1)
        c_ece_s3 = Course(code="EC201", title="Analog Electronic Circuits", department_id=ece.id, credits=4, semester_number=3)
        c_dsp = Course(code="EC301", title="Digital Signal Processing", department_id=ece.id, credits=4, semester_number=5)
        c_ece_s5_2 = Course(code="EC302", title="Microcontrollers & Embedded Systems", department_id=ece.id, credits=4, semester_number=5)
        c_ece_s7 = Course(code="EC401", title="Wireless & Cellular Communications", department_id=ece.id, credits=4, semester_number=7)

        all_courses = [
            c_cse_s1_1, c_cse_s1_2, c_cse_s1_3,
            c_cse_s2_1, c_cse_s2_2, c_cse_s2_3,
            c_cse_s3_1, c_cse_s3_2, c_cse_s3_3,
            c_cse_s4_1, c_cse_s4_2, c_cse_s4_3,
            c_os, c_dbms, c_cn, c_se, c_ai,
            c_cse_s6_1, c_cse_s6_2, c_cse_s6_3,
            c_cse_s7_1, c_cse_s7_2, c_cse_s7_3,
            c_cse_s8_1, c_cse_s8_2,
            c_it_s1, c_it_s3, c_web, c_ds, c_it_s7,
            c_ece_s1, c_ece_s3, c_dsp, c_ece_s5_2, c_ece_s7
        ]
        db.add_all(all_courses)
        db.commit()

        # Assign Faculty to Courses
        db.add_all([
            CourseFaculty(course_id=c_os.id, faculty_id=f1_profile.id),
            CourseFaculty(course_id=c_os.id, faculty_id=f_rajesh_profile.id),
            CourseFaculty(course_id=c_dbms.id, faculty_id=f1_profile.id),
            CourseFaculty(course_id=c_dbms.id, faculty_id=f_priya_profile.id),
            CourseFaculty(course_id=c_cn.id, faculty_id=f1_profile.id),
            CourseFaculty(course_id=c_cn.id, faculty_id=f_suresh_profile.id),
            CourseFaculty(course_id=c_se.id, faculty_id=f_amit_profile.id),
            CourseFaculty(course_id=c_ai.id, faculty_id=f1_profile.id),
            CourseFaculty(course_id=c_ai.id, faculty_id=f_rajesh_profile.id),
            CourseFaculty(course_id=c_dsp.id, faculty_id=f2_profile.id),
            CourseFaculty(course_id=c_dsp.id, faculty_id=f_suresh_profile.id),
            CourseFaculty(course_id=c_web.id, faculty_id=f2_profile.id),
            CourseFaculty(course_id=c_ds.id, faculty_id=f_neha_profile.id),
        ])
        db.commit()

        # 5. Students (Authentic Gujarati / Indian Student Profiles)
        s1_user = User(email="student@campusflow.edu", password_hash=default_pwd, full_name="Dhruv Patel", role="student", avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80")
        s2_user = User(email="student_atrisk@campusflow.edu", password_hash=default_pwd, full_name="Rudra Trivedi", role="student", avatar_url="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80")
        s3_user = User(email="student_ece@campusflow.edu", password_hash=default_pwd, full_name="Hetvi Desai", role="student", avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80")

        s_krisha_user = User(email="krisha.shah@campusflow.edu", password_hash=default_pwd, full_name="Krisha Shah", role="student", avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80")
        s_yash_user = User(email="yash.patel@campusflow.edu", password_hash=default_pwd, full_name="Yash Patel", role="student", avatar_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80")
        s_maitri_user = User(email="maitri.desai@campusflow.edu", password_hash=default_pwd, full_name="Maitri Desai", role="student", avatar_url="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80")
        s_harsh_user = User(email="harsh.mehta@campusflow.edu", password_hash=default_pwd, full_name="Harsh Mehta", role="student", avatar_url="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80")
        s_aarav_user = User(email="aarav.joshi@campusflow.edu", password_hash=default_pwd, full_name="Aarav Joshi", role="student", avatar_url="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=250&q=80")
        s_janki_user = User(email="janki.patel@campusflow.edu", password_hash=default_pwd, full_name="Janki Patel", role="student", avatar_url="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80")
        s_kunal_user = User(email="kunal.shah@campusflow.edu", password_hash=default_pwd, full_name="Kunal Shah", role="student", avatar_url="https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=250&q=80")

        all_student_users = [
            s1_user, s2_user, s3_user,
            s_krisha_user, s_yash_user, s_maitri_user, s_harsh_user,
            s_aarav_user, s_janki_user, s_kunal_user
        ]
        db.add_all(all_student_users)
        db.commit()

        # Student Profiles setup
        s1_profile = StudentProfile(user_id=s1_user.id, department_id=cse.id, roll_number="2024-CSE-012", semester_number=5, gpa=3.82, target_gpa=3.95, cohort_year=2024)
        s2_profile = StudentProfile(user_id=s2_user.id, department_id=cse.id, roll_number="2024-CSE-060", semester_number=5, gpa=2.20, target_gpa=3.00, cohort_year=2024)
        s3_profile = StudentProfile(user_id=s3_user.id, department_id=ece.id, roll_number="2024-ECE-022", semester_number=5, gpa=3.78, target_gpa=3.90, cohort_year=2024)

        s_krisha_prof = StudentProfile(user_id=s_krisha_user.id, department_id=cse.id, roll_number="2024-CSE-019", semester_number=5, gpa=3.91, target_gpa=4.00, cohort_year=2024)
        s_yash_prof = StudentProfile(user_id=s_yash_user.id, department_id=it.id, roll_number="2024-IT-008", semester_number=5, gpa=2.65, target_gpa=3.30, cohort_year=2024)
        s_maitri_prof = StudentProfile(user_id=s_maitri_user.id, department_id=cse.id, roll_number="2024-CSE-025", semester_number=5, gpa=3.55, target_gpa=3.75, cohort_year=2024)
        s_harsh_prof = StudentProfile(user_id=s_harsh_user.id, department_id=ece.id, roll_number="2024-ECE-031", semester_number=5, gpa=3.10, target_gpa=3.50, cohort_year=2024)
        s_aarav_prof = StudentProfile(user_id=s_aarav_user.id, department_id=cse.id, roll_number="2024-CSE-044", semester_number=5, gpa=2.25, target_gpa=3.00, cohort_year=2024)
        s_janki_prof = StudentProfile(user_id=s_janki_user.id, department_id=it.id, roll_number="2024-IT-015", semester_number=5, gpa=3.85, target_gpa=3.95, cohort_year=2024)
        s_kunal_prof = StudentProfile(user_id=s_kunal_user.id, department_id=cse.id, roll_number="2024-CSE-052", semester_number=5, gpa=2.85, target_gpa=3.40, cohort_year=2024)

        all_student_profiles = [
            s1_profile, s2_profile, s3_profile,
            s_krisha_prof, s_yash_prof, s_maitri_prof, s_harsh_prof,
            s_aarav_prof, s_janki_prof, s_kunal_prof
        ]
        db.add_all(all_student_profiles)
        db.commit()

        # Enrollments for each student matching their department and semester
        cse_sem5_courses = [c_os, c_dbms, c_cn, c_se, c_ai]
        it_sem5_courses = [c_web, c_ds, c_dbms, c_se]
        ece_sem5_courses = [c_dsp, c_ece_s5_2, c_cn]

        for sp in [s1_profile, s2_profile, s_krisha_prof, s_maitri_prof, s_aarav_prof, s_kunal_prof]:
            for crs in cse_sem5_courses:
                g = "A" if sp.gpa > 3.6 else ("B" if sp.gpa > 3.0 else "C")
                db.add(Enrollment(student_id=sp.id, course_id=crs.id, semester=sp.semester_number, grade=g))

        for sp in [s_yash_prof, s_janki_prof]:
            for crs in it_sem5_courses:
                g = "A" if sp.gpa > 3.6 else ("B" if sp.gpa > 3.0 else "C")
                db.add(Enrollment(student_id=sp.id, course_id=crs.id, semester=sp.semester_number, grade=g))

        for sp in [s3_profile, s_harsh_prof]:
            for crs in ece_sem5_courses:
                g = "A" if sp.gpa > 3.6 else ("B" if sp.gpa > 3.0 else "C")
                db.add(Enrollment(student_id=sp.id, course_id=crs.id, semester=sp.semester_number, grade=g))

        db.commit()

        db.commit()

        # 6. Attendance Records (Last 25 Days)
        today = date.today()
        student_att_rates = {
            s1_profile.id: 0.94,  # Dhruv Patel
            s2_profile.id: 0.52,  # Rudra Trivedi (At-Risk)
            s3_profile.id: 0.96,  # Hetvi Desai
            s_krisha_prof.id: 0.97,
            s_yash_prof.id: 0.68,
            s_maitri_prof.id: 0.90,
            s_harsh_prof.id: 0.79,
            s_aarav_prof.id: 0.58,
            s_janki_prof.id: 0.95,
            s_kunal_prof.id: 0.71,
        }

        for i in range(25):
            att_date = today - timedelta(days=25 - i)
            if att_date.weekday() < 5:  # Monday to Friday
                for sp in all_student_profiles:
                    rate = student_att_rates.get(sp.id, 0.85)
                    # Get enrolled courses for student
                    enrolled = db.query(Enrollment).filter(Enrollment.student_id == sp.id).all()
                    for en in enrolled:
                        status = "present" if random.random() < rate else "absent"
                        db.add(Attendance(student_id=sp.id, course_id=en.course_id, date=att_date, status=status, marked_by=f1_profile.id))

        db.commit()

        # 7. Internal Marks
        marks_data = [
            # Dhruv Patel (s1_profile)
            (s1_profile.id, c_os.id, "Mid-Term Assessment 1", 92.0, 100.0, 20.0),
            (s1_profile.id, c_os.id, "Quiz 1 - Process Synchronization", 19.0, 20.0, 10.0),
            (s1_profile.id, c_dbms.id, "Mid-Term Assessment 1", 89.0, 100.0, 20.0),
            (s1_profile.id, c_dbms.id, "SQL Lab Practical", 48.0, 50.0, 15.0),
            (s1_profile.id, c_cn.id, "Mid-Term Assessment 1", 94.0, 100.0, 20.0),
            (s1_profile.id, c_ai.id, "Python ML Quiz", 92.0, 100.0, 15.0),

            # Rudra Trivedi (s2_profile - High Risk)
            (s2_profile.id, c_os.id, "Mid-Term Assessment 1", 42.0, 100.0, 20.0),
            (s2_profile.id, c_os.id, "Quiz 1 - Process Synchronization", 7.0, 20.0, 10.0),
            (s2_profile.id, c_dbms.id, "Mid-Term Assessment 1", 48.0, 100.0, 20.0),
            (s2_profile.id, c_cn.id, "Mid-Term Assessment 1", 45.0, 100.0, 20.0),

            # Hetvi Desai (s3_profile - ECE Top Performer)
            (s3_profile.id, c_dsp.id, "Signal Processing Test", 94.0, 100.0, 20.0),
            (s3_profile.id, c_cn.id, "Networks Mid-Sem", 91.0, 100.0, 20.0),

            # Krisha Shah (High Achiever)
            (s_krisha_prof.id, c_os.id, "Mid-Term Assessment 1", 96.0, 100.0, 20.0),
            (s_krisha_prof.id, c_dbms.id, "Database Design Test", 98.0, 100.0, 20.0),
            (s_krisha_prof.id, c_ai.id, "Deep Learning Quiz", 95.0, 100.0, 20.0),

            # Yash Patel (Medium Risk)
            (s_yash_prof.id, c_ds.id, "Data Analytics Mid-Sem", 54.0, 100.0, 20.0),
            (s_yash_prof.id, c_web.id, "REST API Practical", 22.0, 50.0, 15.0),

            # Maitri Desai
            (s_maitri_prof.id, c_os.id, "Mid-Term Assessment 1", 85.0, 100.0, 20.0),
            (s_maitri_prof.id, c_se.id, "Agile Design Quiz", 88.0, 100.0, 20.0),

            # Harsh Mehta (Medium Risk)
            (s_harsh_prof.id, c_dsp.id, "Signal Processing Test", 72.0, 100.0, 20.0),
            (s_harsh_prof.id, c_cn.id, "Networking Lab Quiz", 34.0, 50.0, 15.0),

            # Aarav Joshi (High Risk)
            (s_aarav_prof.id, c_os.id, "Mid-Term Assessment 1", 48.0, 100.0, 20.0),
            (s_aarav_prof.id, c_ai.id, "Neural Net Quiz", 8.0, 20.0, 10.0),

            # Janki Patel
            (s_janki_prof.id, c_ds.id, "Data Science Mid-Sem", 94.0, 100.0, 20.0),
            (s_janki_prof.id, c_web.id, "Web API Project Test", 48.0, 50.0, 15.0),

            # Kunal Shah (Medium Risk)
            (s_kunal_prof.id, c_os.id, "Mid-Term Assessment 1", 64.0, 100.0, 20.0),
            (s_kunal_prof.id, c_dbms.id, "SQL Test", 62.0, 100.0, 20.0),
        ]
        for s_id, c_id, title, score, max_s, weight in marks_data:
            db.add(InternalMark(student_id=s_id, course_id=c_id, title=title, score=score, max_score=max_s, weightage=weight))
        db.commit()

        # 8. Assignments & Submissions
        now_dt = datetime.now()
        a1 = Assignment(course_id=c_os.id, title="Operating Systems Kernel Thread Scheduler", description="Implement a priority thread scheduling simulator in C/C++ with mutex lock handling.", due_date=now_dt + timedelta(days=3), max_score=100.0, created_by=f1_profile.id)
        a2 = Assignment(course_id=c_dbms.id, title="DBMS B-Tree Indexing & Query Optimization", description="Write optimized SQL scripts and compare execution plans with composite indexes.", due_date=now_dt - timedelta(days=2), max_score=100.0, created_by=f_priya_profile.id)
        a3 = Assignment(course_id=c_cn.id, title="TCP/UDP Socket Programming Lab", description="Build a multi-client chat server using non-blocking I/O sockets.", due_date=now_dt + timedelta(days=5), max_score=50.0, created_by=f_suresh_profile.id)
        a4 = Assignment(course_id=c_se.id, title="Software Architecture & Microservices Diagramming", description="Design an UML component diagram for an e-commerce platform.", due_date=now_dt + timedelta(days=4), max_score=100.0, created_by=f_amit_profile.id)
        a5 = Assignment(course_id=c_ds.id, title="Exploratory Data Analysis with Pandas & Seaborn", description="Clean and visualize telemetry datasets using Jupyter notebooks.", due_date=now_dt - timedelta(days=1), max_score=100.0, created_by=f_neha_profile.id)

        db.add_all([a1, a2, a3, a4, a5])
        db.commit()

        # Submissions
        submissions = [
            AssignmentSubmission(assignment_id=a2.id, student_id=s1_profile.id, submission_text="SELECT * FROM students WHERE department_id = 1 USE INDEX (idx_dept); -- Execution Plan attached.", submitted_at=now_dt - timedelta(days=3), score=95.0, feedback="Excellent query optimization analysis.", status="graded"),
            AssignmentSubmission(assignment_id=a1.id, student_id=s1_profile.id, submission_text="Thread scheduler C++ implementation submitted with test cases.", submitted_at=now_dt - timedelta(days=1), score=96.0, feedback="Great concurrency handling.", status="graded"),
            AssignmentSubmission(assignment_id=a2.id, student_id=s_krisha_prof.id, submission_text="Indexed query benchmarks included.", submitted_at=now_dt - timedelta(days=2), score=98.0, feedback="Outstanding work.", status="graded"),
            AssignmentSubmission(assignment_id=a4.id, student_id=s_maitri_prof.id, submission_text="UML component architecture diagrams attached.", submitted_at=now_dt - timedelta(days=1), score=90.0, feedback="Well designed.", status="graded"),
            AssignmentSubmission(assignment_id=a5.id, student_id=s_janki_prof.id, submission_text="Pandas EDA notebook submitted.", submitted_at=now_dt - timedelta(days=2), score=94.0, feedback="Excellent visualizations.", status="graded"),
        ]
        db.add_all(submissions)
        db.commit()

        # 9. Upcoming Exams
        ex1 = Exam(course_id=c_os.id, title="Operating Systems Comprehensive Mid-Sem", exam_date=now_dt + timedelta(days=6), duration_minutes=120, max_score=100.0, room="Auditorium Hall B")
        ex2 = Exam(course_id=c_dbms.id, title="DBMS Relational Algebra Test", exam_date=now_dt + timedelta(days=10), duration_minutes=90, max_score=50.0, room="Lab 3A")
        ex3 = Exam(course_id=c_cn.id, title="Computer Networks Protocol Quiz", exam_date=now_dt + timedelta(days=14), duration_minutes=60, max_score=50.0, room="Room 204")
        ex4 = Exam(course_id=c_se.id, title="Software Engineering Design Exam", exam_date=now_dt + timedelta(days=8), duration_minutes=120, max_score=100.0, room="Room 305")
        ex5 = Exam(course_id=c_ds.id, title="Data Science Analytics Mid-Sem", exam_date=now_dt + timedelta(days=12), duration_minutes=120, max_score=100.0, room="Lab IT-2")
        db.add_all([ex1, ex2, ex3, ex4, ex5])
        db.commit()

        # 10. Timetables (Mon - Fri)
        tt_data = [
            (c_os.id, "Monday", "09:00", "10:30", "Room 301", f1_profile.id),
            (c_dbms.id, "Monday", "11:00", "12:30", "Lab 2B", f_priya_profile.id),
            (c_cn.id, "Tuesday", "09:00", "10:30", "Room 204", f_suresh_profile.id),
            (c_se.id, "Tuesday", "14:00", "15:30", "Room 305", f_amit_profile.id),
            (c_ai.id, "Wednesday", "10:00", "11:30", "Auditorium A", f_rajesh_profile.id),
            (c_ds.id, "Wednesday", "14:00", "15:30", "Lab IT-2", f_neha_profile.id),
            (c_os.id, "Thursday", "09:00", "10:30", "Room 301", f_rajesh_profile.id),
            (c_dbms.id, "Friday", "14:00", "15:30", "Lab 2B", f1_profile.id),
        ]
        for c_id, day, s_t, e_t, room, f_id in tt_data:
            db.add(Timetable(course_id=c_id, day_of_week=day, start_time=s_t, end_time=e_t, room=room, faculty_id=f_id))
        db.commit()

        # 11. Announcements
        ann1 = Announcement(
            title="CampusFlow Annual Technical Symposium 2026",
            content="Registration is now open for the annual coding hackathon and hardware robotics challenge. Submissions close Sept 15.",
            target_role="all",
            department_id=cse.id,
            author_id=admin_user.id
        )
        ann2 = Announcement(
            title="Mid-Semester Exam Schedule & Room Allocations Published",
            content="Please check your student portal timetable view for individual exam room numbers and guidelines.",
            target_role="student",
            department_id=cse.id,
            author_id=f_rajesh_user.id
        )
        ann3 = Announcement(
            title="Guest Lecture on Cloud Native Software Architecture",
            content="Dr. Amit Desai is hosting an interactive industry talk on Microservices & Kubernetes on Friday at 3:00 PM.",
            target_role="all",
            department_id=cse.id,
            author_id=f_amit_user.id
        )
        db.add_all([ann1, ann2, ann3])
        db.commit()

        # 12. ML Risk Predictions Cache for all students
        # Student risk profiles parameters dictionary
        student_risk_configs = {
            s1_profile.id: (94.0, 92.0, 98.0, 3.82, 0, 18.0, 7.5),
            s2_profile.id: (52.0, 42.0, 30.0, 2.20, 4, 3.0, -11.0),
            s3_profile.id: (96.0, 95.0, 100.0, 3.78, 0, 17.0, 6.8),
            s_krisha_prof.id: (97.0, 96.0, 100.0, 3.91, 0, 22.0, 9.0),
            s_yash_prof.id: (68.0, 56.0, 45.0, 2.65, 2, 6.0, -5.0),
            s_maitri_prof.id: (90.0, 86.0, 92.0, 3.55, 0, 15.0, 4.0),
            s_harsh_prof.id: (79.0, 72.0, 75.0, 3.10, 1, 10.0, -1.2),
            s_aarav_prof.id: (58.0, 48.0, 35.0, 2.25, 3, 4.0, -9.0),
            s_janki_prof.id: (95.0, 94.0, 98.0, 3.85, 0, 19.0, 8.0),
            s_kunal_prof.id: (71.0, 64.0, 60.0, 2.85, 1, 8.0, -3.8),
        }

        for st_id, args in student_risk_configs.items():
            pred = risk_service.predict_risk(*args)
            db.add(RiskPrediction(
                student_id=st_id,
                risk_level=pred["risk_level"],
                risk_score=pred["risk_score"],
                key_factors_json=pred["key_factors"]
            ))

        # 13. Student Personal Goals
        db.add_all([
            Goal(student_id=s1_profile.id, title="Achieve 88%+ attendance in Database Management Systems", target_date=today + timedelta(days=20)),
            Goal(student_id=s1_profile.id, title="Score 90+ in Operating Systems End-Sem Exam", target_date=today + timedelta(days=30)),
            Goal(student_id=s2_profile.id, title="Clear pending assignment backlog before Friday", target_date=today + timedelta(days=4)),
            Goal(student_id=s_maitri_prof.id, title="Complete Advanced Software Architecture Certification", target_date=today + timedelta(days=25)),
            Goal(student_id=s_krisha_prof.id, title="Publish Research Paper on Deep Learning Optimization", target_date=today + timedelta(days=45)),
            Goal(student_id=s_yash_prof.id, title="Improve overall attendance above 75% target", target_date=today + timedelta(days=15)),
        ])

        db.commit()
        print("Database successfully populated with realistic Gujarati/Indian demo seed data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
