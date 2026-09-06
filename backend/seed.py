import os
import sys
from dotenv import load_dotenv

# Ensure current working directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import User
from backend.auth import hash_password
from backend.crud import (
    get_first_admin,
    get_first_examiner,
    get_first_student,
    create_admin,
    create_examiner,
    create_student,
)

load_dotenv()


def seed_database():
    db = SessionLocal()
    try:
        admin_email = os.getenv("ADMIN_EMAIL", "admin@proctor.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "AdminSecurePass123!")
        admin_name = os.getenv("ADMIN_NAME", "Super Administrator")

        print("[INFO] Starting SQLAlchemy database seeding...")

        # 1. Single Admin policy
        existing_admin = get_first_admin(db)
        if existing_admin:
            print(f"[INFO] Admin already exists ({existing_admin.email}). Skipping admin creation.")
            print("[INFO] Enforcing single-admin policy: No additional admin will be created.")
        else:
            admin_hash = hash_password(admin_password)
            admin = create_admin(
                db=db,
                full_name=admin_name,
                email=admin_email,
                password_hash=admin_hash,
            )
            print(f"[SUCCESS] Single Admin user created successfully!")
            print(f"   Email: {admin.email}")
            print(f"   Role: {admin.role}")
            print(f"   Status: {admin.status}")

        # 2. Demo Examiners
        existing_examiner = get_first_examiner(db)
        if not existing_examiner:
            examiner_hash = hash_password("Examiner123!")
            # Active examiner
            active_examiner = User(
                email="prof.smith@university.edu",
                password_hash=examiner_hash,
                full_name="Dr. Sarah Smith",
                role="EXAMINER",
                status="ACTIVE",
                institution="Stanford University",
                department="Computer Science",
            )
            db.add(active_examiner)

            # Pending examiner
            pending_examiner = User(
                email="pending.john@techinstitute.org",
                password_hash=examiner_hash,
                full_name="John Doe",
                role="EXAMINER",
                status="PENDING",
                institution="Tech Institute",
                department="Electrical Engineering",
            )
            db.add(pending_examiner)
            db.commit()
            print("[SUCCESS] Demo Active Examiner created (prof.smith@university.edu / Examiner123!)")
            print("[SUCCESS] Demo Pending Examiner created (pending.john@techinstitute.org / Examiner123!)")

        # 3. Demo Student
        existing_student = get_first_student(db)
        if not existing_student:
            student_hash = hash_password("Student123!")
            student = create_student(
                db=db,
                full_name="Alice Walker",
                email="alice.student@college.edu",
                password_hash=student_hash,
            )
            print("[SUCCESS] Demo Active Student created (alice.student@college.edu / Student123!)")

        print("[SUCCESS] Database seeding completed.")
    except Exception as e:
        print(f"[ERROR] Seeding error: {e}")
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
