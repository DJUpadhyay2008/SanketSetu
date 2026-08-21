import subprocess
import os

public_dir = "/home/dutt/Sanket Setu/frontend/public/videos"
os.makedirs(public_dir, exist_ok=True)

videos = [
    {
        "filename": "namaste.mp4",
        "title": "NAMASTE GREETING",
        "category": "EVERYDAY COMMUNICATION",
        "step1": "1. Bring both palms flat together at chest level",
        "step2": "2. Slightly bow head in respectful posture",
        "bg_color": "0x091E28",
        "accent": "0x00A99D"
    },
    {
        "filename": "doctor.mp4",
        "title": "DOCTOR & MEDICINE",
        "category": "HEALTHCARE VOCABULARY",
        "step1": "1. Extend non-dominant wrist facing upward",
        "step2": "2. Place 2 fingers on pulse point to check pulse",
        "bg_color": "0x0A192F",
        "accent": "0x38BDF8"
    },
    {
        "filename": "help.mp4",
        "title": "EMERGENCY HELP",
        "category": "EMERGENCY RESPONSE",
        "step1": "1. Cross arms over chest to alert bystander",
        "step2": "2. Place dominant fist on palm to signal HELP",
        "bg_color": "0x1C1326",
        "accent": "0xF59E0B"
    }
]

for vid in videos:
    out_path = os.path.join(public_dir, vid["filename"])
    
    filter_graph = (
        # Outer Card Container
        f"drawbox=x=60:y=60:w=1160:h=600:color=0x0F172A:t=fill,"
        f"drawbox=x=60:y=60:w=1160:h=600:color=0x334155:t=3,"
        # Top Header Pill Badge
        f"drawbox=x=100:y=95:w=380:h=36:color=0x1E293B:t=fill,"
        f"drawtext=text='SANKET ISL • {vid['category']}':x=120:y=105:fontsize=15:fontcolor=0x00A99D:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,"
        # Main Lesson Title
        f"drawtext=text='{vid['title']}':x=100:y=160:fontsize=36:fontcolor=white:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,"
        # Center Video Motion Card
        f"drawbox=x=440:y=240:w=400:h=220:color=0x1E293B:t=fill,"
        f"drawbox=x=440:y=240:w=400:h=220:color={vid['accent']}:t=2,"
        f"drawtext=text='ISL MOTION DEMONSTRATION':x=480:y=330:fontsize=18:fontcolor=white:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,"
        # Bottom Step Guidance Box
        f"drawbox=x=100:y=500:w=1080:h=120:color=0x020617:t=fill,"
        f"drawbox=x=100:y=500:w=1080:h=120:color=0x1E293B:t=2,"
        f"drawtext=text='{vid['step1']}':x=130:y=530:fontsize=22:fontcolor=white:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,"
        f"drawtext=text='{vid['step2']}':x=130:y=570:fontsize=20:fontcolor=0x94A3B8:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    )

    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"color=c={vid['bg_color']}:s=1280x720:d=5:r=30",
        "-vf", filter_graph,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-t", "5",
        out_path
    ]
    
    print(f"Generating {vid['filename']}...")
    subprocess.run(cmd, check=True)

print("All video assets generated successfully!")
