import streamlit as st
import requests
import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="Job Field", page_icon="🎯", layout="wide",
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


# Progress indicator
st.progress(0.33)
st.caption("Step 1 of 3")

st.title("🎯 Step 1: Enter Your Desired Job Field")

# Show current mode
mode = st.session_state.wizard_data.get('analysis_mode', 'Course Recommendation')
st.info(f"📋 **Mode:** {mode}")

st.markdown("---")

# Job field input
interest_field = st.text_input(
    "What field are you interested in?",
    value=st.session_state.wizard_data.get('job_designation', ''),
    placeholder="e.g., Data Science, Software Engineering",
    help="Enter the career field you want to pursue"
)

# Fetch suggestions
@st.cache_data(ttl=600, show_spinner=False)
def get_suggestions(field):
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/suggest-positions", 
            json={"field": field.lower().strip()},
            timeout=5
        )
        return response.json().get("suggestions", [])
    except:
        return []

# Show suggestions
if interest_field and len(interest_field) >= 3:
    suggestions = get_suggestions(interest_field)
    
    if suggestions:
        st.markdown("### 💡 Quick Select")
        st.caption("Click a position to continue")
        
        cols = st.columns(5)
        for i, suggestion in enumerate(suggestions[:10]):
            with cols[i % 5]:
                if st.button(suggestion, key=f"sug_{i}", use_container_width=True):
                    st.session_state.wizard_data['job_designation'] = suggestion
                    st.switch_page("pages/2_📄_Upload_Files.py")

st.markdown("---")

# Manual entry
if interest_field:
    if st.button("Next: Upload Files →", type="primary", use_container_width=True):
        st.session_state.wizard_data['job_designation'] = interest_field
        st.switch_page("pages/2_📄_Upload_Files.py")
else:
    st.info("👆 Enter a job field above to continue")
