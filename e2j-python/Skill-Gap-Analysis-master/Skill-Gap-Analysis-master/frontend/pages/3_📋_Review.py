import streamlit as st
import requests
import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="Review", page_icon="📋", layout="wide",
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
st.progress(1.0)
st.caption("Step 3 of 3")

st.title("📋 Step 3: Review & Submit")

data = st.session_state.wizard_data

st.subheader("Review Your Information")

col1, col2 = st.columns(2)

with col1:
    st.markdown("**Analysis Mode:**")
    st.info(data.get('analysis_mode', 'Not set'))
    
    st.markdown("**Job Field:**")
    st.info(data.get('job_designation', 'Not set'))

with col2:
    st.markdown("**Resume:**")
    if data.get('resume_file'):
        st.success(f"✅ {data['resume_file'].name}")
    else:
        st.error("❌ No resume uploaded")
    
    st.markdown("**Curriculum:**")
    if data.get('curriculum_file'):
        st.success(f"✅ Custom: {data['curriculum_file'].name}")
    elif data.get('curriculum_choice') and data['curriculum_choice'] != "None":
        st.success(f"✅ {data['curriculum_choice']}")
    else:
        st.error("❌ No curriculum selected")

st.markdown("---")

# Submit function
def submit_analysis():
    files = {
        'resume_file': (
            data['resume_file'].name,
            data['resume_file'].getvalue(),
            data['resume_file'].type
        ),
        # 'curriculum_file': (
        #     data['curriculum_file'].name if data.get('curriculum_file') else 'curriculum.pdf',
        #     data['curriculum_file'].getvalue() if data.get('curriculum_file') else b'',
        #     'application/pdf'
        # )
    }
    
    form_data = {
        'job_designation': data['job_designation'],
        'analysis_mode': data['analysis_mode'],
        'num_sample_jobs': 20,
        'curriculum_choice': data['curriculum_choice']
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/analyze", files=files, data=form_data)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"Failed to submit: {str(e)}")
        return None

# Navigation
col1, col2 = st.columns([1, 1])

with col1:
    if st.button("← Back: Upload Files", use_container_width=True):
        st.switch_page("pages/2_📄_Upload_Files.py")

with col2:
    if st.button("🚀 Submit Analysis", type="primary", use_container_width=True):
        with st.spinner("Submitting..."):
            response = submit_analysis()
        
        if response:
            st.session_state.task_id = response['task_id']
            st.session_state.job_designation = data['job_designation']
            st.session_state.analysis_mode = data['analysis_mode']
            st.success(f"✅ Submitted! Task ID: {response['task_id']}")
            st.switch_page("pages/4_⏳_Progress.py")
