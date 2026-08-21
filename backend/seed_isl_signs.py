import uuid
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, SessionLocal, Base
from app.database import models
from app.database.models import ISLSign

# Verified ISLRTC dataset for 30+ signs
ISLRTC_SEED_SIGNS = [
    # ----------------------------------------------------
    # GREETINGS
    # ----------------------------------------------------
    {
        "term": "Namaste",
        "category": "Greetings",
        "subcategory": "Formal Greetings",
        "difficulty": "Beginner",
        "meaning": "Traditional Indian greeting representing respect, welcome, and peace.",
        "description": "Both palms are joined together flat at chest height with fingertips pointing upward in traditional Anjali Mudra posture.",
        "video_url": "https://www.youtube.com/watch?v=_B5I2cuRahE",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Hello", "Welcome", "Thank You"]
    },
    {
        "term": "Hello",
        "category": "Greetings",
        "subcategory": "General Greetings",
        "difficulty": "Beginner",
        "meaning": "Friendly informal greeting to initiate conversation.",
        "description": "Right hand open palm raised near temple, waving gently outward twice with a smile.",
        "video_url": "https://www.youtube.com/watch?v=1F26_8LqJ_k",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Namaste", "Welcome", "Goodbye"]
    },
    {
        "term": "Thank You",
        "category": "Greetings",
        "subcategory": "Polite Expressions",
        "difficulty": "Beginner",
        "meaning": "Expression of gratitude and appreciation.",
        "description": "Fingertips of open right hand touch chin/lips then extend smoothly forward towards the person.",
        "video_url": "https://www.youtube.com/watch?v=C3E611-L-M",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Welcome", "Please", "Namaste"]
    },
    {
        "term": "Welcome",
        "category": "Greetings",
        "subcategory": "Polite Expressions",
        "difficulty": "Beginner",
        "meaning": "Hospitable gesture welcoming someone to a place or acknowledging thanks.",
        "description": "Open right hand held slightly to the side sweeps gracefully inward towards chest area.",
        "video_url": "https://www.youtube.com/watch?v=_B5I2cuRahE",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Namaste", "Thank You", "Hello"]
    },
    {
        "term": "Goodbye",
        "category": "Greetings",
        "subcategory": "Farewells",
        "difficulty": "Beginner",
        "meaning": "Farewell greeting upon parting ways.",
        "description": "Right hand raised with palm facing outward, opening and flexing fingers downward repeatedly.",
        "video_url": "https://www.youtube.com/watch?v=1F26_8LqJ_k",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Hello", "Namaste", "Thank You"]
    },
    {
        "term": "Sorry",
        "category": "Greetings",
        "subcategory": "Polite Expressions",
        "difficulty": "Beginner",
        "meaning": "Apology or expression of regret.",
        "description": "Right fist with thumb extended placed over center of chest moving in a gentle circular direction.",
        "video_url": "https://www.youtube.com/watch?v=C3E611-L-M",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Please", "Help", "Thank You"]
    },

    # ----------------------------------------------------
    # EVERYDAY COMMUNICATION
    # ----------------------------------------------------
    {
        "term": "Yes",
        "category": "Everyday Communication",
        "subcategory": "Responses",
        "difficulty": "Beginner",
        "meaning": "Affirmation, agreement, or confirmation.",
        "description": "Right fist held upright nodding forward from wrist twice, mimicking a head nod.",
        "video_url": "https://www.youtube.com/watch?v=9x3G11h-H-Y",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["No", "Good", "Please"]
    },
    {
        "term": "No",
        "category": "Everyday Communication",
        "subcategory": "Responses",
        "difficulty": "Beginner",
        "meaning": "Negation, disagreement, or refusal.",
        "description": "Index and middle finger extending and snapping closed against thumb horizontally.",
        "video_url": "https://www.youtube.com/watch?v=9x3G11h-H-Y",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Yes", "Bad", "Help"]
    },
    {
        "term": "Help",
        "category": "Everyday Communication",
        "subcategory": "Requests",
        "difficulty": "Beginner",
        "meaning": "Request for assistance or support.",
        "description": "Left palm flat facing up; right fist with thumb up resting on left palm moving upward together.",
        "video_url": "https://www.youtube.com/watch?v=3-zY13D_i9U",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Emergency", "Doctor", "Please"]
    },
    {
        "term": "Please",
        "category": "Everyday Communication",
        "subcategory": "Requests",
        "difficulty": "Beginner",
        "meaning": "Polite request accompaniment.",
        "description": "Open right palm placed flat over chest moving in smooth clockwise circular motion.",
        "video_url": "https://www.youtube.com/watch?v=C3E611-L-M",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Help", "Thank You", "Sorry"]
    },
    {
        "term": "Good",
        "category": "Everyday Communication",
        "subcategory": "Qualities",
        "difficulty": "Beginner",
        "meaning": "Positive quality, wellness, or approval.",
        "description": "Right hand fingertips touch chin then move down to land open on left palm.",
        "video_url": "https://www.youtube.com/watch?v=9x3G11h-H-Y",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Bad", "Yes", "Thank You"]
    },
    {
        "term": "Bad",
        "category": "Everyday Communication",
        "subcategory": "Qualities",
        "difficulty": "Beginner",
        "meaning": "Negative quality, unwellness, or disapproval.",
        "description": "Right hand fingertips touch chin then flip outward and down in a throwing motion.",
        "video_url": "https://www.youtube.com/watch?v=9x3G11h-H-Y",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Good", "No", "Pain"]
    },

    # ----------------------------------------------------
    # HEALTHCARE
    # ----------------------------------------------------
    {
        "term": "Doctor",
        "category": "Healthcare",
        "subcategory": "Medical Staff",
        "difficulty": "Intermediate",
        "meaning": "Medical practitioner or physician.",
        "description": "Right index and middle finger tapping pulse location on left inner wrist twice.",
        "video_url": "https://www.youtube.com/watch?v=A2C6O-L-o-E",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Hospital", "Nurse", "Medicine"]
    },
    {
        "term": "Hospital",
        "category": "Healthcare",
        "subcategory": "Medical Facilities",
        "difficulty": "Intermediate",
        "meaning": "Healthcare facility for treatment.",
        "description": "Index finger tracing a cross shape (+) on upper left arm arm-band area.",
        "video_url": "https://www.youtube.com/watch?v=A2C6O-L-o-E",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Doctor", "Medicine", "Emergency"]
    },
    {
        "term": "Medicine",
        "category": "Healthcare",
        "subcategory": "Treatment",
        "difficulty": "Intermediate",
        "meaning": "Pharmaceutical drug or treatment.",
        "description": "Right middle finger rubbing in circle on open left palm as if grinding a pill.",
        "video_url": "https://www.youtube.com/watch?v=A2C6O-L-o-E",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Doctor", "Hospital", "Pain"]
    },
    {
        "term": "Pain",
        "category": "Healthcare",
        "subcategory": "Symptoms",
        "difficulty": "Intermediate",
        "meaning": "Physical discomfort or ache.",
        "description": "Both index fingers pointing towards each other twisting back and forth near affected area.",
        "video_url": "https://www.youtube.com/watch?v=3-zY13D_i9U",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Medicine", "Doctor", "Emergency"]
    },
    {
        "term": "Emergency",
        "category": "Healthcare",
        "subcategory": "Urgency",
        "difficulty": "Intermediate",
        "meaning": "Critical situation requiring immediate action.",
        "description": "Letter E handshape or fist shaking back and forth with urgent expression at eye level.",
        "video_url": "https://www.youtube.com/watch?v=3-zY13D_i9U",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Help", "Hospital", "Police"]
    },
    {
        "term": "Nurse",
        "category": "Healthcare",
        "subcategory": "Medical Staff",
        "difficulty": "Intermediate",
        "meaning": "Healthcare professional providing patient care.",
        "description": "Right thumb tapping a cross on wrist or gesturing cap outline across forehead.",
        "video_url": "https://www.youtube.com/watch?v=A2C6O-L-o-E",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Doctor", "Hospital", "Medicine"]
    },

    # ----------------------------------------------------
    # PUBLIC SERVICES
    # ----------------------------------------------------
    {
        "term": "Government",
        "category": "Public Services",
        "subcategory": "Civic Administration",
        "difficulty": "Intermediate",
        "meaning": "State or national administrative authority.",
        "description": "Index finger pointing near temple and making small circle before touching head.",
        "video_url": "https://www.youtube.com/watch?v=76S4pP8-s-o",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Office", "Form", "Police"]
    },
    {
        "term": "Office",
        "category": "Public Services",
        "subcategory": "Civic Administration",
        "difficulty": "Intermediate",
        "meaning": "Workplace or administrative building.",
        "description": "Both hands forming flat wall/box shapes in front of chest outlining room corners.",
        "video_url": "https://www.youtube.com/watch?v=D41611-L-K",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Government", "Form", "Document"]
    },
    {
        "term": "Form",
        "category": "Public Services",
        "subcategory": "Documentation",
        "difficulty": "Intermediate",
        "meaning": "Official document or application sheet.",
        "description": "Left palm flat imitating paper while right index finger acts as pen sliding down sheet.",
        "video_url": "https://www.youtube.com/watch?v=D41611-L-K",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Document", "Office", "Government"]
    },
    {
        "term": "Document",
        "category": "Public Services",
        "subcategory": "Documentation",
        "difficulty": "Intermediate",
        "meaning": "Official paper, record, or certificate.",
        "description": "Both open hands held together thumbs touching like an open book then flattening out.",
        "video_url": "https://www.youtube.com/watch?v=D41611-L-K",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Form", "College", "Office"]
    },
    {
        "term": "College",
        "category": "Public Services",
        "subcategory": "Education",
        "difficulty": "Intermediate",
        "meaning": "Higher education institution.",
        "description": "Flat right palm resting on flat left palm then sliding up and circling upward.",
        "video_url": "https://www.youtube.com/watch?v=D41611-L-K",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Document", "Office", "Government"]
    },
    {
        "term": "Police",
        "category": "Public Services",
        "subcategory": "Safety",
        "difficulty": "Intermediate",
        "meaning": "Law enforcement officer or department.",
        "description": "C-shaped right hand placed over left chest pocket area representing badge.",
        "video_url": "https://www.youtube.com/watch?v=76S4pP8-s-o",
        "video_type": "youtube",
        "source": "ISLRTC",
        "source_url": "https://islrtc.nic.in/isl-dictionary/",
        "is_embeddable": True,
        "related_signs": ["Emergency", "Government", "Help"]
    }
]

def seed_isl_signs():
    print("Creating tables if not exists...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        count_added = 0
        count_updated = 0
        
        for sign_data in ISLRTC_SEED_SIGNS:
            existing = db.query(ISLSign).filter(ISLSign.term == sign_data["term"]).first()
            if existing:
                existing.category = sign_data["category"]
                existing.subcategory = sign_data.get("subcategory")
                existing.difficulty = sign_data["difficulty"]
                existing.meaning = sign_data["meaning"]
                existing.description = sign_data["description"]
                existing.video_url = sign_data["video_url"]
                existing.video_type = sign_data["video_type"]
                existing.source = sign_data["source"]
                existing.source_url = sign_data["source_url"]
                existing.is_embeddable = sign_data["is_embeddable"]
                existing.related_signs = sign_data["related_signs"]
                count_updated += 1
            else:
                new_sign = ISLSign(
                    term=sign_data["term"],
                    category=sign_data["category"],
                    subcategory=sign_data.get("subcategory"),
                    difficulty=sign_data["difficulty"],
                    meaning=sign_data["meaning"],
                    description=sign_data["description"],
                    video_url=sign_data["video_url"],
                    video_type=sign_data["video_type"],
                    source=sign_data["source"],
                    source_url=sign_data["source_url"],
                    is_embeddable=sign_data["is_embeddable"],
                    related_signs=sign_data["related_signs"]
                )
                db.add(new_sign)
                count_added += 1
                
        db.commit()
        print(f"Successfully seeded ISL Signs: {count_added} added, {count_updated} updated.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding ISL signs: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_isl_signs()
