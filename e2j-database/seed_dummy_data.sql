-- E2J Dummy Data Seed Script
-- Run against e2j_db after the Spring Boot app has started at least once (to auto-create tables)
-- Safe to re-run: uses ON CONFLICT DO NOTHING where possible

-- ── NOTE: Replace institute_user_id and counsellor_user_id with actual IDs from your users table ──
-- To find them: SELECT id, email, role FROM users;

-- ─────────────────────────────────────────────────────────────────────────────
-- PROGRAMS (for the institute user — manish@hubblehox.com)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  inst_id BIGINT;
BEGIN
  SELECT i.id INTO inst_id FROM institutes i
    JOIN users u ON i.user_id = u.id
    WHERE u.email = 'manish@hubblehox.com'
    LIMIT 1;

  IF inst_id IS NULL THEN
    RAISE NOTICE 'Institute not found for manish@hubblehox.com — skipping program seed';
    RETURN;
  END IF;

  INSERT INTO programs (institute_id, degree, name, duration, total_fees, intake_capacity, deadline, status)
  VALUES
    (inst_id, 'B.Tech', 'Computer Science & Engineering', 4, 150000, 120, '2025-08-31', 'PUBLISHED'),
    (inst_id, 'B.Tech', 'Information Technology', 4, 145000, 90, '2025-08-31', 'PUBLISHED'),
    (inst_id, 'B.Tech', 'Electronics & Communication', 4, 140000, 60, '2025-08-31', 'PUBLISHED'),
    (inst_id, 'M.Tech', 'Artificial Intelligence & ML', 2, 120000, 40, '2025-09-15', 'DRAFT'),
    (inst_id, 'MBA', 'Business Administration', 2, 180000, 80, '2025-09-30', 'PUBLISHED')
  ON CONFLICT DO NOTHING;

  -- Program majors
  INSERT INTO program_majors (program_id, major)
  SELECT p.id, m.major
  FROM programs p
  CROSS JOIN (VALUES
    ('Artificial Intelligence & Data Science'),
    ('Cyber Security'),
    ('Cloud Computing')
  ) AS m(major)
  WHERE p.institute_id = inst_id AND p.name = 'Computer Science & Engineering'
  ON CONFLICT DO NOTHING;

END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FACULTY
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  inst_id BIGINT;
BEGIN
  SELECT i.id INTO inst_id FROM institutes i
    JOIN users u ON i.user_id = u.id
    WHERE u.email = 'manish@hubblehox.com'
    LIMIT 1;

  IF inst_id IS NULL THEN RETURN; END IF;

  INSERT INTO faculty (institute_id, name, mode, bio, status)
  VALUES
    (inst_id, 'Dr. Priya Sharma', 'Online', 'Expert in Machine Learning and Deep Learning with 12 years of experience.', 'AVAILABLE'),
    (inst_id, 'Prof. Rajesh Mehta', 'Offline', 'Specializes in Database Systems and Software Engineering.', 'AVAILABLE'),
    (inst_id, 'Dr. Anita Desai', 'Hybrid', 'Researcher in Cyber Security and Network Systems.', 'BUSY'),
    (inst_id, 'Prof. Vikram Nair', 'Online', 'Expert in Cloud Computing and DevOps practices.', 'AVAILABLE')
  ON CONFLICT DO NOTHING;

END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- INSTITUTE STUDENTS
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  inst_id BIGINT;
BEGIN
  SELECT i.id INTO inst_id FROM institutes i
    JOIN users u ON i.user_id = u.id
    WHERE u.email = 'manish@hubblehox.com'
    LIMIT 1;

  IF inst_id IS NULL THEN RETURN; END IF;

  INSERT INTO institute_students (institute_id, name, email, phone, enrollment_no, program, specialization, year, cgpa, status)
  VALUES
    (inst_id, 'Arjun Mehta', 'arjun.mehta@student.edu', '9876543210', 'CS2021001', 'B.Tech CSE', 'Artificial Intelligence & Data Science', 3, 8.5, 'ACTIVE'),
    (inst_id, 'Priya Sharma', 'priya.sharma@student.edu', '9876543211', 'CS2021002', 'B.Tech CSE', 'Cyber Security', 3, 9.1, 'ACTIVE'),
    (inst_id, 'Kiran Desai', 'kiran.desai@student.edu', '9876543212', 'IT2022001', 'B.Tech IT', 'Cloud Computing', 2, 7.8, 'ACTIVE'),
    (inst_id, 'Neha Joshi', 'neha.joshi@student.edu', '9876543213', 'CS2020001', 'B.Tech CSE', 'Artificial Intelligence & Data Science', 4, 8.9, 'ACTIVE'),
    (inst_id, 'Rahul Gupta', 'rahul.gupta@student.edu', '9876543214', 'CS2020002', 'B.Tech CSE', 'Cyber Security', 4, 7.4, 'ACTIVE'),
    (inst_id, 'Anjali Singh', 'anjali.singh@student.edu', '9876543215', 'MBA2023001', 'MBA', 'Business Administration', 1, 8.2, 'ACTIVE'),
    (inst_id, 'Vikram Rao', 'vikram.rao@student.edu', '9876543216', 'EC2021001', 'B.Tech ECE', 'VLSI Design', 3, 7.6, 'ACTIVE'),
    (inst_id, 'Swati Patil', 'swati.patil@student.edu', '9876543217', 'CS2019001', 'B.Tech CSE', 'Cloud Computing', 4, 9.3, 'PLACED')
  ON CONFLICT DO NOTHING;

END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- CURRICULUM
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  inst_id BIGINT;
BEGIN
  SELECT i.id INTO inst_id FROM institutes i
    JOIN users u ON i.user_id = u.id
    WHERE u.email = 'manish@hubblehox.com'
    LIMIT 1;

  IF inst_id IS NULL THEN RETURN; END IF;

  INSERT INTO curricula (institute_id, program_name, degree, major, academic_year, status, last_updated)
  VALUES
    (inst_id, 'Computer Science & Engineering', 'B.Tech', 'Artificial Intelligence & Data Science', '2025-26', 'YET_TO_START', CURRENT_DATE),
    (inst_id, 'Computer Science & Engineering', 'B.Tech', 'Cyber Security', '2025-26', 'AI_PROCESSING', CURRENT_DATE),
    (inst_id, 'Information Technology', 'B.Tech', 'Cloud Computing', '2024-25', 'AI_COMPLETED', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- CAMPUS RECRUITMENT
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  inst_id BIGINT;
BEGIN
  SELECT i.id INTO inst_id FROM institutes i
    JOIN users u ON i.user_id = u.id
    WHERE u.email = 'manish@hubblehox.com'
    LIMIT 1;

  IF inst_id IS NULL THEN RETURN; END IF;

  INSERT INTO campus_recruitments (institute_id, industry_partner, drive_name, job_role, program_name, specialization, eligibility, package_offered, drive_date, status)
  VALUES
    (inst_id, 'Google India', 'Campus Hiring 2025', 'Software Engineer', 'B.Tech CSE', 'Artificial Intelligence & Data Science', '7.5 CGPA and above', '18-22 LPA', '2025-09-15', 'ACCEPTED'),
    (inst_id, 'Amazon', 'Summer Internship 2025', 'Data Engineer Intern', 'B.Tech CSE', 'Cloud Computing, AI/ML', '7.0 CGPA and above', '50,000/month stipend', '2025-07-01', 'INVITED'),
    (inst_id, 'TCS', 'Developer Intern May 2025', 'Developer Intern', 'B.Tech CSE, B.Tech IT', 'All', '6.5 CGPA and above', '3.5 LPA', '2025-05-20', 'RECEIVED'),
    (inst_id, 'Infosys', 'Mass Recruitment Drive', 'Associate Engineer', 'B.Tech CSE, B.Tech IT, B.Tech ECE', 'All', '6.0 CGPA and above', '3.8-4.5 LPA', '2025-08-10', 'REJECTED')
  ON CONFLICT DO NOTHING;

END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- VENUE AVAILABILITY
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  inst_id BIGINT;
BEGIN
  SELECT i.id INTO inst_id FROM institutes i
    JOIN users u ON i.user_id = u.id
    WHERE u.email = 'manish@hubblehox.com'
    LIMIT 1;

  IF inst_id IS NULL THEN RETURN; END IF;

  INSERT INTO venue_availabilities (institute_id, room_type, room_no, date_from, date_to, time_from, time_to, computers_offered, total_offered)
  VALUES
    (inst_id, 'Lab', 'Lab 1', '2025-07-01', '2025-07-31', '09:00', '13:00', 40, 50),
    (inst_id, 'Classroom', 'Room 201', '2025-07-01', '2025-07-31', '10:00', '17:00', NULL, 60),
    (inst_id, 'Seminar Hall', 'Main Hall', '2025-09-01', '2025-09-30', '09:00', '18:00', NULL, 200)
  ON CONFLICT DO NOTHING;

END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- COUNSELLOR PROFILE + RECORDS (hari@hubblehox.com)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  c_id BIGINT;
  c_user_id BIGINT;
BEGIN
  SELECT u.id INTO c_user_id FROM users u WHERE u.email = 'hari@hubblehox.com' LIMIT 1;

  IF c_user_id IS NULL THEN
    RAISE NOTICE 'Counsellor hari@hubblehox.com not found — skipping counsellor seed';
    RETURN;
  END IF;

  -- Upsert counsellor profile
  INSERT INTO counsellors (user_id, phone, house_number, flat_number, area, city, state, pincode, country, landmark, experience_category, experience_years, experience_months, status)
  VALUES (c_user_id, '+91 9876501234', 'A-204, Sunrise Heights', 'Flat 4, 2nd Floor', 'Baner', 'Pune', 'Maharashtra', '411045', 'India', 'Near D-Mart', 'Experienced', 4, 6, 'APPROVED')
  ON CONFLICT (user_id) DO UPDATE SET
    phone = EXCLUDED.phone,
    house_number = EXCLUDED.house_number,
    flat_number = EXCLUDED.flat_number,
    area = EXCLUDED.area,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    pincode = EXCLUDED.pincode,
    country = EXCLUDED.country,
    experience_category = EXCLUDED.experience_category,
    experience_years = EXCLUDED.experience_years,
    experience_months = EXCLUDED.experience_months;

  SELECT id INTO c_id FROM counsellors WHERE user_id = c_user_id;

  -- Skills
  DELETE FROM counsellor_skills WHERE counsellor_id = c_id;
  INSERT INTO counsellor_skills (counsellor_id, skill) VALUES
    (c_id, 'Network Security'),
    (c_id, 'Vulnerability Assessment'),
    (c_id, 'Penetration Testing'),
    (c_id, 'Python For Security'),
    (c_id, 'Ethical Hacking'),
    (c_id, 'Kali Linux'),
    (c_id, 'Wireshark'),
    (c_id, 'Firewall Management');

  -- Education
  INSERT INTO counsellor_educations (counsellor_id, degree, school_name, major, year_of_passing, percentage_value)
  VALUES
    (c_id, 'PhD', 'IIT Mumbai', 'Computer Engineering', '2016', 7.0),
    (c_id, 'B.E. (Computer Engineering)', 'MIT Academy Of Engineering, Pune', 'Cyber Security & Information Security', '2010', 8.4)
  ON CONFLICT DO NOTHING;

  -- Work Experience
  INSERT INTO counsellor_work_experiences (counsellor_id, company_name, employment_type, location, location_type, from_date, to_date, currently_working)
  VALUES
    (c_id, 'Tata Consultancy Services', 'Full Time', 'Pune', 'On site', 'Aug-22', NULL, true),
    (c_id, 'QuickHeal Technologies', 'Internship', 'Pune', 'Work From Home', 'Jan-22', 'Jul-22', false)
  ON CONFLICT DO NOTHING;

  -- Certifications
  INSERT INTO counsellor_certifications (counsellor_id, certificate_id, certificate_name, awarding_institute, valid_till)
  VALUES
    (c_id, 'PCUH76235847HVI', 'Microsoft Certified: Azure Fundamentals', 'Microsoft', '31-12-2029'),
    (c_id, 'PCUH76235848JKL', 'AWS Certified Solutions Architect – Associate', 'Amazon Web Services (AWS)', '31-12-2029'),
    (c_id, 'CEH-2024-7891', 'Certified Ethical Hacker (CEH)', 'EC-Council', '31-12-2026')
  ON CONFLICT DO NOTHING;

  -- Sessions
  INSERT INTO counsellor_sessions (counsellor_id, date_from, date_to, recur_weeks, fee_amount, fee_type, status, notes)
  VALUES
    (c_id, '2026-06-16', '2026-06-30', 2, 800.0, 'Per Session', 'AVAILABLE', NULL),
    (c_id, '2026-06-17', '2026-06-17', 1, 800.0, 'Per Session', 'UPCOMING', NULL),
    (c_id, '2026-06-10', '2026-06-10', 1, 800.0, 'Per Session', 'COMPLETED', 'Excellent session'),
    (c_id, '2026-06-05', '2026-06-05', 1, 800.0, 'Per Session', 'CANCELLED', 'Candidate no-show')
  ON CONFLICT DO NOTHING;

END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- COUNSELLOR DASHBOARD update (update availability counts for dashboard)
-- ─────────────────────────────────────────────────────────────────────────────
-- No extra inserts needed — the /counsellor/dashboard endpoint computes from sessions table

SELECT 'Seed complete. Check above for any NOTICE messages about missing users.' AS status;
