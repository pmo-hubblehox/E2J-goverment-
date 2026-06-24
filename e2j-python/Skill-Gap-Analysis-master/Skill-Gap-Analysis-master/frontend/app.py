import streamlit as st
import os

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(
    page_title="Career Recommendation System",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="collapsed"
)

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


# Initialize session state
if 'wizard_data' not in st.session_state:
    st.session_state.wizard_data = {
        'analysis_mode': None,
        'job_designation': None,
        'resume_file': None,
        'curriculum_choice': None,
        'curriculum_file': None
    }

# Get analysis mode from URL
query_params = st.query_params
if 'mode' in query_params:
    mode = query_params['mode']
    if mode == 'course':
        st.session_state.wizard_data['analysis_mode'] = 'Course Recommendation'
    elif mode == 'curriculum':
        st.session_state.wizard_data['analysis_mode'] = 'Curriculum Recommendation'

# Welcome page
st.title("🎯 Career Recommendation System")

st.markdown("""
Welcome to the **Career Recommendation System**! 

This tool analyzes your resume, educational background, and career goals to provide:
- 🎓 **Course Recommendations** - Personalized learning paths
- 📚 **Curriculum Improvements** - Enhance educational programs

### How It Works

1. **Enter your desired job field** - Tell us what you're aiming for
2. **Upload documents** - Your resume and curriculum
3. **Get personalized insights** - AI-powered analysis and recommendations
""")

st.markdown("---")

# Choose analysis mode
st.subheader("Select Your Analysis Mode")

col1, col2 = st.columns(2)

with col1:
    if st.button("🎓 Course Recommendations", use_container_width=True, type="primary"):
        st.session_state.wizard_data['analysis_mode'] = 'Course Recommendation'
        st.switch_page("pages/1_🎯_Job_Field.py")

with col2:
    if st.button("📚 Curriculum Recommendations", use_container_width=True):
        st.session_state.wizard_data['analysis_mode'] = 'Curriculum Recommendation'
        st.switch_page("pages/1_🎯_Job_Field.py")

st.markdown("---")
st.caption("💡 Tip: Bookmark a specific mode with `?mode=course` or `?mode=curriculum`")
