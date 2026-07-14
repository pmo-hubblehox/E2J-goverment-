export interface RoleGroup {
  category: string;
  roles: string[];
}

export const ROLE_GROUPS: RoleGroup[] = [
  // Engineering & Tech — temporarily disabled.
  // {
  //   category: 'Engineering & Tech',
  //   roles: [
  //     'Frontend Developer', 'Backend Developer', 'Fullstack Developer', 'Data Analyst',
  //     'AI/ML Engineer', 'Software Tester/QA Engineer', 'Cybersecurity Analyst', 'Cloud Engineer',
  //     'UI/UX Designer', 'Mobile App Developer', 'Game Developer', 'Blockchain Developer',
  //     'Embedded Systems Engineer', 'Database Administrator', 'Business Analyst',
  //     'Technical Support Engineer', 'Automation Engineer', 'IT Systems Administrator',
  //     'Cloud Support Associate', 'Software Engineer', 'Data Scientist', 'DevOps Engineer',
  //   ],
  // },
  {
    category: 'ITI & Vocational',
    roles: [
      'EV Mechanic', 'EV Battery Technician', 'EV Charging Station Technician', 'Automotive Electrician',
    ],
  },
];

// Flat list — kept for existing consumers that don't need grouping.
export const ROLE_AREAS = ROLE_GROUPS.flatMap(g => g.roles);
