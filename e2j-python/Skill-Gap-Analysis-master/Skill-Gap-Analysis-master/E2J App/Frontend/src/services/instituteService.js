import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/institute";

// Create axios instance with auth header
const getAuthHeaders = () => {
  const token = localStorage.getItem("instituteToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Submit onboarding form data
export async function submitOnboarding({ programs, students }) {
  try {
    const payload = {
      programs: programs.map((program) => ({
        programId: program.id,
        name: program.name,
        majors: program.majors ? [program.majors] : [],
        duration: parseInt(program.duration) || 0,
        fees: program.fees,
        intake: parseInt(program.intake) || 0,
        deadline: program.deadline ? new Date(program.deadline) : null,
        brochureFileName: program.brochureFileName || "",
        syllabusFileName: program.syllabusFileName || "",
        creditStructureFileName: program.creditStructureFileName || "",
        timetableFileName: program.timetableFileName || "",
      })),
      students: students.map((student) => ({
        studentId: student.id,
        name: student.name,
        program: student.program,
        specialization: student.specialization,
        email: student.email,
        phone: student.contact,
        address: student.address,
      })),
    };

    const { data } = await axios.post(
      `${API_BASE_URL}/onboarding`,
      payload,
      getAuthHeaders()
    );

    return data;
  } catch (error) {
    console.error("Error submitting onboarding:", error);
    throw error;
  }
}

// Get programs
export async function getPrograms() {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/programs`,
      getAuthHeaders()
    );
    return data;
  } catch (error) {
    console.error("Error fetching programs:", error);
    throw error;
  }
}

// Get students
export async function getStudents() {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/students`,
      getAuthHeaders()
    );
    return data;
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
}

// Get institute profile
export async function getProfile() {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/profile`,
      getAuthHeaders()
    );
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
}
