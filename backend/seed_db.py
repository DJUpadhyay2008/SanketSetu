import sys
import os
import uuid
from datetime import datetime

# Adjust path to import backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, Base, SessionLocal
from app.database import models

def seed():
    print("Resetting database tables...")
    # Drop and Re-create tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Tables re-created successfully.")

    db = SessionLocal()
    try:
        print("Seeding courses and lessons...")
        
        # Course 1: Everyday Greetings
        course1 = models.Course(
            id=uuid.uuid4(),
            title="Everyday ISL Greetings",
            description="Learn standard everyday greetings in Indian Sign Language, including Hello, Namaste, and Thank You.",
            category="Everyday Communication",
            difficulty="Beginner",
            downloadable=True,
            content_version=1,
            validation_status="published",
            content_source="ISLRTC Dictionary"
        )
        db.add(course1)
        db.flush()

        lesson1_1 = models.Lesson(
            id=uuid.uuid4(),
            course_id=course1.id,
            title="Introduction to Namaste",
            content="In India, Namaste is the standard greeting, performed by bringing both hands together in a prayer position at chest level.",
            difficulty="Beginner",
            category="Everyday Communication",
            xp_reward=50,
            video_url="https://yhyjigvxjxtaykchffpd.supabase.co/storage/v1/object/public/sanket-assets/namaste.mp4",
            images=["Bring both palms flat together at chest level.", "Slightly bow your head as a sign of respect."],
            meaning="A traditional Indian greeting meaning 'I bow to the divine in you'.",
            example_sentence="Sign 'Namaste' when meeting someone for the first time or welcoming guests.",
            related_signs=["HELLO", "WELCOME", "GOODBYE"],
            practice_instructions="Record yourself bringing both hands flat together at chest level, look directly at the camera, and bow your head slightly.",
            scenario_prompt="You are meeting an elder in India who is deaf. What is the most culturally respectful sign to greet them?",
            scenario_options=[
                "Fingerspell H-E-L-L-O",
                "Bring hands together in a prayer position (Namaste) and bow slightly",
                "Wave your hand rapidly side to side"
            ],
            scenario_correct_answer="Bring hands together in a prayer position (Namaste) and bow slightly",
            scenario_feedback="Correct! The 'Namaste' gesture is the traditional, respectful way to greet elders and peers in India.",
            downloadable=True,
            content_version=1,
            validation_status="published",
            content_source="ISLRTC Dictionary"
        )
        db.add(lesson1_1)
        db.flush()

        # Quiz 1 for Lesson 1.1
        quiz1 = models.Quiz(
            id=uuid.uuid4(),
            lesson_id=lesson1_1.id,
            title="Namaste Sign Check"
        )
        db.add(quiz1)
        db.flush()

        q1_question = models.QuizQuestion(
            id=uuid.uuid4(),
            quiz_id=quiz1.id,
            question_text="How are the hands positioned when signing 'Namaste' in ISL?",
            options=[
                "Clenched into tight fists",
                "Brought together flat in a prayer position at chest level",
                "Crossed over the forehead to shield the eyes"
            ],
            correct_option="Brought together flat in a prayer position at chest level"
        )
        db.add(q1_question)

        # Course 2: Healthcare ISL Vocabulary
        course2 = models.Course(
            id=uuid.uuid4(),
            title="Healthcare ISL & Medical Vocab",
            description="Communicate effectively in medical situations. Learn signs for doctor, pain, fever, and medicine.",
            category="Healthcare",
            difficulty="Intermediate",
            downloadable=True,
            content_version=1,
            validation_status="published",
            content_source="ISLRTC Healthcare Glossary"
        )
        db.add(course2)
        db.flush()

        lesson2_1 = models.Lesson(
            id=uuid.uuid4(),
            course_id=course2.id,
            title="Signing 'Doctor' & 'Medicine'",
            content="Doctor is signed by checking the pulse on the wrist of the non-dominant hand using two fingers.",
            difficulty="Intermediate",
            category="Healthcare",
            xp_reward=100,
            video_url="https://yhyjigvxjxtaykchffpd.supabase.co/storage/v1/object/public/sanket-assets/doctor.mp4",
            images=[
                "Extend your left arm forward, wrist facing upward.",
                "Place your index and middle fingers of your right hand on your left wrist pulse point to simulate checking a pulse."
            ],
            meaning="Medical practitioner certified to treat patients.",
            example_sentence="Sign 'DOCTOR' to ask for medical assistance at a clinic or hospital.",
            related_signs=["HOSPITAL", "PAIN", "FEVER", "MEDICINE"],
            practice_instructions="Practice placing your index and middle fingers of your right hand onto your left wrist pulse point. Maintain a focused expression.",
            scenario_prompt="You are at a hospital clinic and need to find the doctor. How do you sign 'Where is the doctor?'?",
            scenario_options=[
                "Sign 'DOCTOR' by checking the pulse on your wrist, followed by a questioning face",
                "Point to your head and make a circle",
                "Wave both hands in the air"
            ],
            scenario_correct_answer="Sign 'DOCTOR' by checking the pulse on your wrist, followed by a questioning face",
            scenario_feedback="Correct! Signing 'DOCTOR' by touching your wrist pulse point communicates the medical professional role immediately.",
            downloadable=True,
            content_version=1,
            validation_status="published",
            content_source="ISLRTC Healthcare Glossary"
        )
        db.add(lesson2_1)
        db.flush()

        # Quiz 2 for Lesson 2.1
        quiz2 = models.Quiz(
            id=uuid.uuid4(),
            lesson_id=lesson2_1.id,
            title="Doctor Sign Check"
        )
        db.add(quiz2)
        db.flush()

        q2_question = models.QuizQuestion(
            id=uuid.uuid4(),
            quiz_id=quiz2.id,
            question_text="Which gesture represents 'Doctor' in Indian Sign Language?",
            options=[
                "Pointing at your chest",
                "Tapping two fingers on your opposite wrist pulse point",
                "Saluting with your right hand"
            ],
            correct_option="Tapping two fingers on your opposite wrist pulse point"
        )
        db.add(q2_question)

        # Course 3: Emergency ISL Phrases
        course3 = models.Course(
            id=uuid.uuid4(),
            title="Emergency Response Signs",
            description="Learn crucial emergency phrases for accidents, ambulance requests, and police assistance.",
            category="Emergency",
            difficulty="Advanced",
            downloadable=True,
            content_version=1,
            validation_status="published",
            content_source="National Disaster Management Authority (NDMA) ISL Guide"
        )
        db.add(course3)
        db.flush()

        lesson3_1 = models.Lesson(
            id=uuid.uuid4(),
            course_id=course3.id,
            title="Requesting Emergency Help",
            content="Emergency Help is signed by crossing your arms over your chest and rapidly tapping, followed by the sign for 'HELP' (placing dominant fist on non-dominant open palm).",
            difficulty="Advanced",
            category="Emergency",
            xp_reward=150,
            video_url="https://yhyjigvxjxtaykchffpd.supabase.co/storage/v1/object/public/sanket-assets/help.mp4",
            images=[
                "Cross your arms at your chest to signal danger/alert.",
                "Place your right closed fist onto your open left palm and lift them up together twice to signal help."
            ],
            meaning="Requesting immediate life-saving or security assistance.",
            example_sentence="Use this sign during critical events to request dispatchers or bystanders for immediate help.",
            related_signs=["AMBULANCE", "POLICE", "DANGER"],
            practice_instructions="Practice signing danger (crossed chest tapping) followed by the support sign (fist over palm). Make sure your face displays high urgency.",
            scenario_prompt="An accident occurs on the road. You see a bystander. What signs do you execute to call for help?",
            scenario_options=[
                "Fingerspell A-C-C-I-D-E-N-T slowly",
                "Sign 'DANGER' (cross arms) followed by 'HELP' (fist on palm) with urgent facial expression",
                "Sign 'TRAIN' and 'TICKET' repeatedly"
            ],
            scenario_correct_answer="Sign 'DANGER' (cross arms) followed by 'HELP' (fist on palm) with urgent facial expression",
            scenario_feedback="Correct! The combinations of danger gestures and support request with urgent facial expressions are standard for reporting emergencies.",
            downloadable=True,
            content_version=1,
            validation_status="published",
            content_source="NDMA ISL Guide"
        )
        db.add(lesson3_1)
        db.flush()

        # Quiz 3 for Lesson 3.1
        quiz3 = models.Quiz(
            id=uuid.uuid4(),
            lesson_id=lesson3_1.id,
            title="Emergency Help Sign Check"
        )
        db.add(quiz3)
        db.flush()

        q3_question = models.QuizQuestion(
            id=uuid.uuid4(),
            quiz_id=quiz3.id,
            question_text="What is the secondary sign appended to 'Danger' to ask for assistance?",
            options=[
                "Waving goodbye",
                "Placing your dominant fist on your open non-dominant palm and lifting them together",
                "Clapping hands together twice"
            ],
            correct_option="Placing your dominant fist on your open non-dominant palm and lifting them together"
        )
        db.add(q3_question)
        db.flush()

        print("Seeding government schemes...")
        # Scheme 1: ADIP
        scheme1 = models.Scheme(
            id=uuid.uuid4(),
            title="ADIP Scheme (Assistance to Disabled Persons for Purchase/Fitting of Aids and Appliances)",
            description="Provides grants to assist needy disabled persons in procuring durable, sophisticated, and scientifically manufactured standard aids and appliances that can promote their physical, social, and psychological rehabilitation.",
            department="Ministry of Social Justice and Empowerment, Central Govt",
            benefits="Subsidizes or fully covers the cost of assistive devices (including digital hearing aids, smart canes, smartphones for deaf/blind learners). 100% subsidy for family income up to Rs. 22,500/month. 50% subsidy for family income between Rs. 22,500 and Rs. 30,000/month.",
            eligibility="Indian citizen of any age. Possesses a valid disability certificate of 40% or higher. Monthly family income does not exceed Rs. 30,000.",
            documents=["Aadhaar Card", "Disability Certificate (40%+)", "Income Certificate", "Passport Size Photograph"],
            state="Central",
            category="Assistive Technology",
            application_method="Online",
            official_url="https://depwd.gov.in/adip-scheme/",
            source_name="DEPwD Official Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme1)
        db.flush()

        db.add(models.SchemeEligibility(scheme_id=scheme1.id, criteria_key="max_income", criteria_value="30000"))
        db.add(models.SchemeEligibility(scheme_id=scheme1.id, criteria_key="disability_category", criteria_value="hearing_impairment"))

        # Scheme 2: NFPwD
        scheme2 = models.Scheme(
            id=uuid.uuid4(),
            title="National Fellowship for Persons with Disabilities (NFPwD)",
            description="Provides financial fellowships to students with disabilities pursuing higher education research courses such as M.Phil. and Ph.D. in recognized Indian universities.",
            department="Department of Empowerment of Persons with Disabilities, Central Govt",
            benefits="Fellowship stipend of Rs. 31,000/month for the first two years (JRF) and Rs. 35,000/month for subsequent years (SRF), plus house rent allowance (HRA) and contingency grants.",
            eligibility="Indian student with a valid 40%+ disability certificate, admitted into a full-time M.Phil or Ph.D program.",
            documents=["Aadhaar Card", "Disability Certificate (40%+)", "University Admission Proof", "Master's Degree Marksheet"],
            state="Central",
            category="Education",
            application_method="Online",
            official_url="https://depwd.gov.in/national-fellowship-for-pwd/",
            source_name="DEPwD Fellowship Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme2)
        db.flush()

        db.add(models.SchemeEligibility(scheme_id=scheme2.id, criteria_key="student", criteria_value="true"))
        db.add(models.SchemeEligibility(scheme_id=scheme2.id, criteria_key="education_level", criteria_value="postgraduate"))

        # Scheme 3: Gujarat Divyang Sahay
        scheme3 = models.Scheme(
            id=uuid.uuid4(),
            title="Gujarat Divyang Sahay Yojana (Direct Financial Aid)",
            description="A state-funded direct benefit transfer scheme in Gujarat to support severely disabled individuals with monthly pension grants to help with subsistence.",
            department="Social Justice and Empowerment Department, Government of Gujarat",
            benefits="Direct pension allowance of Rs. 1,000 per month deposited directly to the beneficiary's Jan-Dhan bank account.",
            eligibility="Permanent resident of Gujarat. Age between 18 and 79 years. Family income below the official poverty line. Degree of disability must be 80% or greater.",
            documents=["Gujarat Domicile Proof", "Aadhaar Card", "Disability Certificate (80%+)", "BPL Card / Income Certificate"],
            state="Gujarat",
            category="Financial Aid",
            application_method="Online/Offline",
            official_url="http://sje.gujarat.gov.in/",
            source_name="SJE Gujarat Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme3)
        db.flush()

        db.add(models.SchemeEligibility(scheme_id=scheme3.id, criteria_key="state", criteria_value="Gujarat"))
        db.add(models.SchemeEligibility(scheme_id=scheme3.id, criteria_key="min_age", criteria_value="18"))
        db.add(models.SchemeEligibility(scheme_id=scheme3.id, criteria_key="max_age", criteria_value="79"))

        print("Seeding demo institutions and metrics...")
        # 1. KP Gujarat University Hospital (healthcare)
        inst1 = models.Institution(
            id=uuid.UUID("4a0f8b1a-2009-4bf9-866d-1bf8cbbe1101"),
            name="KP Gujarat University Hospital",
            category="healthcare",
            city="Vadodara",
            is_verified=True
        )
        db.add(inst1)
        db.flush()

        m1 = models.InstitutionMetric(
            id=uuid.uuid4(),
            institution_id=inst1.id,
            has_isl_interpreters=True,
            staff_trained_percentage=85,
            has_video_relay_services=True,
            signage_accessibility_score=9,
            isl_resources_score=13,
            emergency_readiness_score=14,
            learning_participation_score=9,
            user_feedback_score=8,
            accessibility_audit_score=9
        )
        db.add(m1)

        # 2. Gandhinagar University Campus (education)
        inst2 = models.Institution(
            id=uuid.UUID("4a0f8b1a-2009-4bf9-866d-1bf8cbbe1102"),
            name="Gandhinagar University Campus",
            category="education",
            city="Gandhinagar",
            is_verified=True
        )
        db.add(inst2)
        db.flush()

        m2 = models.InstitutionMetric(
            id=uuid.uuid4(),
            institution_id=inst2.id,
            has_isl_interpreters=True,
            staff_trained_percentage=70,
            has_video_relay_services=False,
            signage_accessibility_score=8,
            isl_resources_score=11,
            emergency_readiness_score=10,
            learning_participation_score=8,
            user_feedback_score=7,
            accessibility_audit_score=8
        )
        db.add(m2)

        # 3. District Collector Office, Vadodara (civic)
        inst3 = models.Institution(
            id=uuid.UUID("4a0f8b1a-2009-4bf9-866d-1bf8cbbe1103"),
            name="District Collector Office, Vadodara",
            category="civic",
            city="Vadodara",
            is_verified=True
        )
        db.add(inst3)
        db.flush()

        m3 = models.InstitutionMetric(
            id=uuid.uuid4(),
            institution_id=inst3.id,
            has_isl_interpreters=False,
            staff_trained_percentage=40,
            has_video_relay_services=True,
            signage_accessibility_score=7,
            isl_resources_score=8,
            emergency_readiness_score=12,
            learning_participation_score=6,
            user_feedback_score=8,
            accessibility_audit_score=7
        )
        db.add(m3)

        # 4. Tata Consultancy Services - Vadodara (corporate)
        inst4 = models.Institution(
            id=uuid.UUID("4a0f8b1a-2009-4bf9-866d-1bf8cbbe1104"),
            name="Tata Consultancy Services - Vadodara",
            category="corporate",
            city="Vadodara",
            is_verified=True
        )
        db.add(inst4)
        db.flush()

        m4 = models.InstitutionMetric(
            id=uuid.uuid4(),
            institution_id=inst4.id,
            has_isl_interpreters=True,
            staff_trained_percentage=90,
            has_video_relay_services=True,
            signage_accessibility_score=9,
            isl_resources_score=14,
            emergency_readiness_score=13,
            learning_participation_score=9,
            user_feedback_score=9,
            accessibility_audit_score=9
        )
        db.add(m4)

        # 5. Vadodara Municipal Corporation (civic)
        inst5 = models.Institution(
            id=uuid.UUID("4a0f8b1a-2009-4bf9-866d-1bf8cbbe1105"),
            name="Vadodara Municipal Corporation",
            category="civic",
            city="Vadodara",
            is_verified=False
        )
        db.add(inst5)
        db.flush()

        m5 = models.InstitutionMetric(
            id=uuid.uuid4(),
            institution_id=inst5.id,
            has_isl_interpreters=False,
            staff_trained_percentage=20,
            has_video_relay_services=False,
            signage_accessibility_score=4,
            isl_resources_score=3,
            emergency_readiness_score=5,
            learning_participation_score=2,
            user_feedback_score=4,
            accessibility_audit_score=4
        )
        db.add(m5)

        print("Seeding demo user, profile, and credentials...")
        demo_user_id = uuid.UUID("d3b07384-d113-495f-9e77-94d3a0429f55")
        demo_user = models.User(
            id=demo_user_id,
            email="citizen@sanketsetu.in"
        )
        db.add(demo_user)
        db.flush()

        demo_profile = models.Profile(
            id=demo_user_id,
            display_name="Sanket Citizen",
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
            isl_level="2",
            badges=["Quick Starter", "First Greeting", "Daily Streak"],
            interests=["Healthcare ISL", "Civic Services", "Daily Vocabulary"]
        )
        db.add(demo_profile)

        # Seed real credentials for the demo user
        demo_cred = models.Credential(
            id=uuid.UUID("88888888-8888-8888-8888-888888888888"),
            user_id=demo_user_id,
            course_id=course1.id,
            grade="A+",
            credential_url="/verify/88888888-8888-8888-8888-888888888888"
        )
        db.add(demo_cred)

        # Seed Practice Partners (User profiles)
        partner1_id = uuid.uuid4()
        db.add(models.User(id=partner1_id, email="aarav@sanketsetu.in"))
        db.flush()
        db.add(models.Profile(
            id=partner1_id,
            display_name="Aarav Mehta",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
            isl_level="2",
            badges=["Quick Starter", "Fingerspell Pro"],
            interests=["Emergency Support", "Travel Signs", "Fingerspelling"]
        ))

        partner2_id = uuid.uuid4()
        db.add(models.User(id=partner2_id, email="priya@sanketsetu.in"))
        db.flush()
        db.add(models.Profile(
            id=partner2_id,
            display_name="Priya Patel",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
            isl_level="1",
            badges=["First Greeting"],
            interests=["Everyday Chats", "Healthcare Vocabulary"]
        ))

        partner3_id = uuid.uuid4()
        db.add(models.User(id=partner3_id, email="rohan@sanketsetu.in"))
        db.flush()
        db.add(models.Profile(
            id=partner3_id,
            display_name="Rohan Das",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
            isl_level="3",
            badges=["Community Helper", "12-Day Streak"],
            interests=["Legal Terms", "Civic Services", "Public Assistance"]
        ))

        # Seed Mentors
        mentor1_user_id = uuid.uuid4()
        db.add(models.User(id=mentor1_user_id, email="anita@sanketsetu.in"))
        db.flush()
        db.add(models.Profile(
            id=mentor1_user_id,
            display_name="Anita Desai",
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
            isl_level="3",
            badges=["Verified Mentor", "Sanket Expert"],
            interests=["Medical ISL", "Interpreter Training"]
        ))
        db.add(models.Mentor(
            id=uuid.uuid4(),
            user_id=mentor1_user_id,
            certification_details="National ISL Trainer Certification (Level A)",
            rating=4.8,
            is_active=True,
            is_verified=True,
            assessment_score=95,
            reviews_count=18
        ))

        mentor2_user_id = uuid.uuid4()
        db.add(models.User(id=mentor2_user_id, email="rajesh@sanketsetu.in"))
        db.flush()
        db.add(models.Profile(
            id=mentor2_user_id,
            display_name="Rajesh Sharma",
            avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
            isl_level="3",
            badges=["Verified Mentor", "Disaster Specialist"],
            interests=["Emergency Response", "Civic Signage"]
        ))
        db.add(models.Mentor(
            id=uuid.uuid4(),
            user_id=mentor2_user_id,
            certification_details="Disaster Sign Management Specialist (A+ Certified)",
            rating=4.9,
            is_active=True,
            is_verified=True,
            assessment_score=98,
            reviews_count=24
        ))

        db.commit()
        print("Database seeded successfully with 3 courses, 3 lessons, 3 quizzes, 3 questions, 3 schemes, 5 institutions, 3 practice partners, 2 mentors, and a demo user with credentials.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
