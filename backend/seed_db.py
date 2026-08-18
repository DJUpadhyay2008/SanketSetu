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
        # Scheme 1: ADIP (Central)
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

        # Scheme 2: NFPwD (Central)
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

        # Scheme 4: Maharashtra Divyangjan Subsistence Pension
        scheme4 = models.Scheme(
            id=uuid.uuid4(),
            title="Sanjay Gandhi Niradhar Anudan Yojana & Divyang Maintenance Allowance",
            description="State pension scheme in Maharashtra providing monthly financial sustenance to persons with disabilities.",
            department="Social Justice & Special Assistance Department, Govt of Maharashtra",
            benefits="Monthly financial grant of Rs. 1,500/month directly transferred to beneficiary accounts.",
            eligibility="Permanent resident of Maharashtra. Disability percentage 40%+. Annual income under Rs. 50,000.",
            documents=["Maharashtra Domicile Certificate", "Aadhaar Card", "Disability Certificate (40%+)", "Income Certificate"],
            state="Maharashtra",
            category="Financial Aid",
            application_method="Online",
            official_url="https://sanjaygandhimaharashtra.gov.in",
            source_name="MahaOnline Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme4)
        db.flush()
        db.add(models.SchemeEligibility(scheme_id=scheme4.id, criteria_key="state", criteria_value="Maharashtra"))

        # Scheme 5: Delhi Disability Pension Scheme
        scheme5 = models.Scheme(
            id=uuid.uuid4(),
            title="Delhi Financial Assistance to Persons with Special Needs",
            description="Delhi Government direct pension assistance for persons with disabilities living in the National Capital Territory of Delhi.",
            department="Department of Social Welfare, Government of NCT of Delhi",
            benefits="Rs. 2,500/month direct pension allowance.",
            eligibility="Resident of Delhi for at least 5 years. Disability percentage 40%+. Family income below Rs. 1,00,000/year.",
            documents=["Delhi Residence Proof (5 Years)", "Disability Certificate", "Aadhaar Card", "Bank Account Details"],
            state="Delhi",
            category="Financial Aid",
            application_method="Online",
            official_url="https://edistrict.delhigovt.nic.in",
            source_name="e-District Delhi",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme5)
        db.flush()
        db.add(models.SchemeEligibility(scheme_id=scheme5.id, criteria_key="state", criteria_value="Delhi"))

        # Scheme 6: Tamil Nadu Differently Abled Maintenance Allowance
        scheme6 = models.Scheme(
            id=uuid.uuid4(),
            title="Tamil Nadu Monthly Maintenance Allowance for Differently Abled Persons",
            description="Comprehensive maintenance allowance provided by Tamil Nadu government for severely differently abled citizens.",
            department="Department for Welfare of Differently Abled Persons, Govt of Tamil Nadu",
            benefits="Monthly allowance of Rs. 2,000/month plus free RTC bus passes across Tamil Nadu.",
            eligibility="Resident of Tamil Nadu. Disability percentage 40%+.",
            documents=["TN Smart Card / Ration Card", "Disability Certificate", "Aadhaar Card"],
            state="Tamil Nadu",
            category="Financial Aid",
            application_method="Online",
            official_url="https://www.scda.tn.gov.in",
            source_name="TN Welfare Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme6)
        db.flush()
        db.add(models.SchemeEligibility(scheme_id=scheme6.id, criteria_key="state", criteria_value="Tamil Nadu"))

        # Scheme 7: Karnataka Vikalangara Monthly Pension Scheme
        scheme7 = models.Scheme(
            id=uuid.uuid4(),
            title="Karnataka Vikalangara Pension & Assistive Equipment Scheme",
            description="State-wide social security pension and assistive equipment distribution scheme for PwDs in Karnataka.",
            department="Directorate for the Empowerment of Differently Abled, Govt of Karnataka",
            benefits="Rs. 1,200 to Rs. 2,000/month based on disability severity, plus free hearing aid kits.",
            eligibility="Karnataka domicile resident with 40%+ certified disability.",
            documents=["Karnataka Domicile Certificate", "Disability ID Card (UDID)", "Aadhaar Card"],
            state="Karnataka",
            category="Financial Aid",
            application_method="Online",
            official_url="https://sevasindhu.karnataka.gov.in",
            source_name="Seva Sindhu Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme7)
        db.flush()
        db.add(models.SchemeEligibility(scheme_id=scheme7.id, criteria_key="state", criteria_value="Karnataka"))

        # Scheme 8: NHFDC Swavalamban Kendra Loans (Central)
        scheme8 = models.Scheme(
            id=uuid.uuid4(),
            title="Divyangjan Swavalamban Concessional Loan Scheme",
            description="Low-interest concessional micro-loans for starting self-employment ventures, small businesses, or vocational training for disabled individuals.",
            department="National Handicapped Finance and Development Corporation (NHFDC), Central Govt",
            benefits="Concessional loans up to Rs. 5,00,000 at low interest rates (5% to 8% p.a.). Special 1% rebate for female beneficiaries.",
            eligibility="Indian citizen aged 18 years or above with 40%+ certified disability and income under Rs. 3,00,000/year.",
            documents=["UDID Card", "Business Proposal / Plan", "Aadhaar Card", "Income & Domicile Proof"],
            state="Central",
            category="Financial Aid",
            application_method="Online",
            official_url="http://www.nhfdc.nic.in",
            source_name="NHFDC Official Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme8)
        db.flush()
        db.add(models.SchemeEligibility(scheme_id=scheme8.id, criteria_key="state", criteria_value="Central"))

        # Scheme 9: Unique Disability ID (UDID) Swavlamban Pass (Central)
        scheme9 = models.Scheme(
            id=uuid.uuid4(),
            title="Unique Disability ID (UDID) National Swavlamban Card Services",
            description="Single nationwide smart identity card providing seamless access to all central & state disability schemes, healthcare concessions, and transit benefits.",
            department="Department of Empowerment of Persons with Disabilities, Central Govt",
            benefits="Universal medical certificate validation, free/concessional rail and bus transport travel nationwide, simplified portal applications.",
            eligibility="All Indian citizens certified with 40% or more disability by an authorized medical board.",
            documents=["Medical Board Certificate", "Aadhaar Card", "Passport Photo"],
            state="Central",
            category="Assistive Technology",
            application_method="Online",
            official_url="https://www.swavlambancard.gov.in",
            source_name="Swavlamban Card Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme9)
        db.flush()
        db.add(models.SchemeEligibility(scheme_id=scheme9.id, criteria_key="state", criteria_value="Central"))

        # Scheme 10: Uttar Pradesh Divyangjan Pension Yojana
        scheme10 = models.Scheme(
            id=uuid.uuid4(),
            title="UP Divyangjan Pension & Shadi Protsahan Puraskar Yojana",
            description="Direct benefit pension allowance and marriage financial grant for differently abled residents of Uttar Pradesh.",
            department="Divyangjan Empowerment Department, Govt of Uttar Pradesh",
            benefits="Monthly pension of Rs. 1,000/month plus one-time marriage incentive grant of up to Rs. 35,000.",
            eligibility="Permanent resident of UP aged 18+, annual income below BPL threshold (Rs. 46,080 rural, Rs. 56,460 urban).",
            documents=["UP Domicile Certificate", "Disability Certificate (40%+)", "BPL Ration Card / Income Certificate"],
            state="Uttar Pradesh",
            category="Financial Aid",
            application_method="Online",
            official_url="http://sspy-up.gov.in",
            source_name="SSPY UP Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme10)
        db.flush()
        db.add(models.SchemeEligibility(scheme_id=scheme10.id, criteria_key="state", criteria_value="Uttar Pradesh"))

        # Scheme 11: West Bengal Manabik Pension Scheme
        scheme11 = models.Scheme(
            id=uuid.uuid4(),
            title="West Bengal Manabik Pension Scheme for PwD",
            description="Monthly pension grant for persons with disabilities residing in West Bengal.",
            department="Department of Women & Child Development & Social Welfare, Govt of West Bengal",
            benefits="Rs. 1,000/month direct pension to beneficiary bank accounts.",
            eligibility="Resident of West Bengal with 50%+ certified disability and monthly family income below Rs. 10,000.",
            documents=["WB Domicile Proof", "Disability Certificate (50%+)", "Bank Passbook"],
            state="West Bengal",
            category="Financial Aid",
            application_method="Online/Offline",
            official_url="https://wb.gov.in",
            source_name="WB Social Welfare Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme11)
        db.flush()
        db.add(models.SchemeEligibility(scheme_id=scheme11.id, criteria_key="state", criteria_value="West Bengal"))

        # Scheme 12: Deendayal Disabled Rehabilitation Scheme (DDRS)
        scheme12 = models.Scheme(
            id=uuid.uuid4(),
            title="Deendayal Disabled Rehabilitation Scheme (DDRS)",
            description="Provides grant-in-aid support to non-governmental organizations to run special schools, vocational centers, and early intervention clinics for deaf and disabled children.",
            department="Ministry of Social Justice and Empowerment, Central Govt",
            benefits="Free schooling, skill development, sign language therapy, and hostel accommodations in accredited special schools.",
            eligibility="Children and young adults with disabilities across all Indian states.",
            documents=["Disability Certificate", "School Enrollment Form", "Aadhaar Card"],
            state="Central",
            category="Education",
            application_method="Offline/School Desk",
            official_url="https://depwd.gov.in/ddrs-scheme/",
            source_name="DEPwD Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme12)
        db.flush()
        db.add(models.SchemeEligibility(scheme_id=scheme12.id, criteria_key="state", criteria_value="Central"))

        # Scheme 13: Kerala Swasraya Scheme for PwD
        scheme13 = models.Scheme(
            id=uuid.uuid4(),
            title="Kerala Swasraya Self-Employment Scheme for Divyangjan",
            description="Financial assistance for single parents, mothers of severely disabled children, and disabled individuals to start micro enterprises.",
            department="Social Justice Department, Government of Kerala",
            benefits="One-time financial grant up to Rs. 35,000 for setting up small shops, handicraft centers, or digital workstations.",
            eligibility="Kerala resident with 70%+ disability or parent of severely disabled child. BPL income status.",
            documents=["Kerala Domicile", "Disability Certificate", "BPL Certificate", "Project Plan"],
            state="Kerala",
            category="Financial Aid",
            application_method="Online",
            official_url="http://www.sjd.kerala.gov.in",
            source_name="SJD Kerala Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme13)
        db.flush()
        db.add(models.SchemeEligibility(scheme_id=scheme13.id, criteria_key="state", criteria_value="Kerala"))

        # Scheme 14: Rajasthan Vishesh Yogyajan Samman Pension
        scheme14 = models.Scheme(
            id=uuid.uuid4(),
            title="Rajasthan Chief Minister Vishesh Yogyajan Samman Pension",
            description="Social security monthly pension scheme for persons with disabilities in Rajasthan.",
            department="Social Justice and Empowerment Department, Govt of Rajasthan",
            benefits="Rs. 750 to Rs. 1,500/month depending on age and disability severity.",
            eligibility="Permanent resident of Rajasthan with 40%+ certified disability.",
            documents=["Jan Aadhaar Card", "Disability Certificate", "Bank Account Details"],
            state="Rajasthan",
            category="Financial Aid",
            application_method="Online",
            official_url="https://ssp.rajasthan.gov.in",
            source_name="SSP Rajasthan Portal",
            last_verified_at=datetime.utcnow(),
            status="active"
        )
        db.add(scheme14)
        db.flush()
        db.add(models.SchemeEligibility(scheme_id=scheme14.id, criteria_key="state", criteria_value="Rajasthan"))

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
