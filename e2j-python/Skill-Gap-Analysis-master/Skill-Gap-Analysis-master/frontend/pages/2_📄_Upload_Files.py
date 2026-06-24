import streamlit as st

st.set_page_config(page_title="Upload Files", page_icon="📄", layout="wide",
    initial_sidebar_state="collapsed")

# Completely hide sidebar
st.markdown("""
    <style>
        [data-testid="stSidebar"] {
            display: none;
        }
        [data-testid="collapsedControl"] {
            display: none;
        }
    </style>
""", unsafe_allow_html=True)

# Progress
st.progress(0.66)
st.caption("Step 2 of 3")

st.title("📄 Step 2: Upload Your Documents")

mode = st.session_state.wizard_data.get('analysis_mode', 'Course Recommendation')
job = st.session_state.wizard_data.get('job_designation', 'Not specified')

st.info(f"📋 **Mode:** {mode} | **Field:** {job}")

st.markdown("---")

# Resume upload
st.subheader("📄 Your Resume")
resume_file = st.file_uploader(
    "Upload Resume (PDF/DOCX)",
    type=['pdf', 'docx'],
    help="Upload your resume file"
)

if resume_file:
    st.success(f"✅ Uploaded: {resume_file.name}")
    st.session_state.wizard_data['resume_file'] = resume_file

st.markdown("---")

# Curriculum
st.subheader("📚 Educational Background")

curriculum_choice = st.selectbox(
    "Select Your Background",
    options=["None", "Computer Science", "Civil Engineering",
            "Mechanical Engineering", "Electrical Engineering"]
)

st.session_state.wizard_data['curriculum_choice'] = curriculum_choice

# Validation
has_resume = resume_file is not None
has_curriculum = curriculum_choice != "None"
is_valid = has_resume and has_curriculum

if not has_resume:
    st.warning("⚠️ Please upload your resume")
if not has_curriculum:
    st.warning("⚠️ Please select your Background")

st.markdown("---")

# Navigation
col1, col2 = st.columns([1, 1])

with col1:
    if st.button("← Back: Job Field", use_container_width=True):
        st.switch_page("pages/1_🎯_Job_Field.py")

with col2:
    if st.button("Next: Review →", type="primary", use_container_width=True, disabled=not is_valid):
        st.switch_page("pages/3_📋_Review.py")
