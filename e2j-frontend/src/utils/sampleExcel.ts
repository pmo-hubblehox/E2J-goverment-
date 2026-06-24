import * as XLSX from 'xlsx';

function download(wb: XLSX.WorkBook, fileName: string) {
  XLSX.writeFile(wb, fileName);
}

// ── Credit Structure ─────────────────────────────────────────────────────────
export function downloadCreditStructureSample() {
  const creditWs = XLSX.utils.aoa_to_sheet([
    [
      'Semester', 'Name Of Course', 'Course Id',
      'L', 'P', 'T', 'Credits',
      'T-1', 'T-2', 'IE',
      'Points', 'Time (Hrs)', 'End Semester Weightage (%)', 'Total Points',
    ],
    // ── Semester 1 ──
    [1, 'Engineering Mathematics – I',              'BS-CSE101', 3, 0, 1, 4,  15, 15, 20, 100, 3, 50, 150],
    [1, 'Engineering Physics',                      'BS-CSE102', 3, 1, 0, 4,  15, 15, 20, 100, 3, 50, 150],
    [1, 'Problem Solving & Python Programming',     'CS-CSE101', 3, 2, 0, 4,  15, 15, 20, 100, 3, 50, 150],
    [1, 'Digital Logic & Computer Organisation',    'CS-CSE102', 3, 0, 1, 4,  15, 15, 20, 100, 3, 50, 150],
    [1, 'Engineering Graphics & Visualization',     'ES-CSE101', 1, 2, 0, 2,  10, 10, 30,  50, 2, 50,  100],
    [1, 'Communication Skills in English',          'HS-CSE101', 2, 0, 1, 3,  15, 15, 20, 100, 3, 50, 100],
    // ── Semester 2 ──
    [2, 'Engineering Mathematics – II',             'BS-CSE201', 3, 0, 1, 4,  15, 15, 20, 100, 3, 50, 150],
    [2, 'Data Structures & Algorithms',             'CS-CSE201', 3, 2, 0, 4,  15, 15, 20, 100, 3, 50, 150],
    [2, 'Object Oriented Programming with Java',    'CS-CSE202', 3, 2, 0, 4,  15, 15, 20, 100, 3, 50, 150],
    [2, 'Computer Architecture & Organisation',     'CS-CSE203', 3, 0, 1, 4,  15, 15, 20, 100, 3, 50, 150],
    [2, 'Discrete Mathematics',                     'BS-CSE202', 3, 0, 1, 4,  15, 15, 20, 100, 3, 50, 150],
    [2, 'Environmental Studies',                    'HS-CSE201', 2, 0, 0, 2,   0,  0, 50,   0, 0,100,  50],
    // ── Semester 3 ──
    [3, 'Operating Systems',                        'CS-CSE301', 3, 2, 0, 4,  15, 15, 20, 100, 3, 50, 150],
    [3, 'Database Management Systems',              'CS-CSE302', 3, 2, 0, 4,  15, 15, 20, 100, 3, 50, 150],
    [3, 'Computer Networks',                        'CS-CSE303', 3, 0, 1, 4,  15, 15, 20, 100, 3, 50, 150],
    [3, 'Theory of Computation',                    'CS-CSE304', 3, 0, 1, 4,  15, 15, 20, 100, 3, 50, 150],
    [3, 'Software Engineering',                     'CS-CSE305', 3, 0, 1, 4,  15, 15, 20, 100, 3, 50, 150],
    [3, 'Design Thinking & Innovation Lab',         'ES-CSE301', 0, 2, 0, 1,   0,  0, 50,   0, 0,100,  50],
    // ── Semester 4 ──
    [4, 'Compiler Design',                          'CS-CSE401', 3, 0, 1, 4,  15, 15, 20, 100, 3, 50, 150],
    [4, 'Machine Learning',                         'CS-CSE402', 3, 2, 0, 4,  15, 15, 20, 100, 3, 50, 150],
    [4, 'Web Technologies',                         'CS-CSE403', 2, 2, 0, 3,  15, 15, 20, 100, 3, 50, 150],
    [4, 'Artificial Intelligence',                  'CS-CSE404', 3, 0, 1, 4,  15, 15, 20, 100, 3, 50, 150],
    [4, 'Probability & Statistics',                 'BS-CSE401', 3, 0, 1, 4,  15, 15, 20, 100, 3, 50, 150],
    [4, 'Mini Project',                             'CS-CSE405', 0, 4, 0, 2,   0,  0,100,   0, 0,  0,  100],
  ]);

  creditWs['!cols'] = [
    { wch: 10 }, { wch: 42 }, { wch: 12 },
    { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 8 },
    { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 8 }, { wch: 10 }, { wch: 26 }, { wch: 12 },
  ];

  const timetableWs = XLSX.utils.aoa_to_sheet([
    ['Semester', 'Date', 'Time', 'Course Id', 'Name Of Course', 'Faculty'],
    // Sem 1 - key dates
    [1, '01/07/2025', '08:00-09:00',  'BS-CSE101', 'Engineering Mathematics – I',           'Dr. Rajesh Kumar'],
    [1, '03/07/2025', '09:00-10:00',  'BS-CSE102', 'Engineering Physics',                   'Prof. Ananya Singh'],
    [1, '05/07/2025', '10:00-11:00',  'CS-CSE101', 'Problem Solving & Python Programming',  'Dr. Priya Mehta'],
    [1, '07/07/2025', '11:00-12:00',  'CS-CSE102', 'Digital Logic & Computer Organisation', 'Dr. Suresh Nair'],
    [1, '22/08/2025', '08:00-10:00',  'BS-CSE101', 'Engineering Mathematics – I (T-1)',     'Dr. Rajesh Kumar'],
    [1, '22/08/2025', '10:00-12:00',  'BS-CSE102', 'Engineering Physics (T-1)',             'Prof. Ananya Singh'],
    [1, '23/08/2025', '08:00-10:00',  'CS-CSE101', 'Python Programming (T-1)',              'Dr. Priya Mehta'],
    [1, '25/09/2025', '08:00-10:00',  'BS-CSE101', 'Engineering Mathematics – I (T-2)',     'Dr. Rajesh Kumar'],
    [1, '06/10/2025', '09:00-12:00',  'BS-CSE101', 'End Semester – Maths I',               'Exam Cell'],
    [1, '07/10/2025', '09:00-12:00',  'BS-CSE102', 'End Semester – Physics',               'Exam Cell'],
    [1, '08/10/2025', '09:00-12:00',  'CS-CSE101', 'End Semester – Python',                'Exam Cell'],
    [1, '09/10/2025', '09:00-12:00',  'CS-CSE102', 'End Semester – Digital Logic',         'Exam Cell'],
    // Sem 2 - key dates
    [2, '03/11/2025', '08:00-09:00',  'CS-CSE201', 'Data Structures & Algorithms',         'Dr. Kiran Desai'],
    [2, '05/11/2025', '09:00-10:00',  'CS-CSE202', 'OOP with Java',                        'Prof. Meera Iyer'],
    [2, '10/01/2026', '08:00-10:00',  'CS-CSE201', 'Data Structures (T-1)',                'Dr. Kiran Desai'],
    [2, '12/01/2026', '08:00-10:00',  'CS-CSE202', 'OOP with Java (T-1)',                  'Prof. Meera Iyer'],
    [2, '23/02/2026', '08:00-10:00',  'CS-CSE201', 'Data Structures (T-2)',                'Dr. Kiran Desai'],
    [2, '13/04/2026', '09:00-12:00',  'CS-CSE201', 'End Semester – Data Structures',       'Exam Cell'],
    [2, '14/04/2026', '09:00-12:00',  'CS-CSE202', 'End Semester – OOP Java',              'Exam Cell'],
    // Sem 3 - key dates
    [3, '01/07/2026', '08:00-09:00',  'CS-CSE301', 'Operating Systems',                    'Dr. Amit Sharma'],
    [3, '02/07/2026', '09:00-10:00',  'CS-CSE302', 'Database Management Systems',          'Prof. Deepa Nair'],
    [3, '20/08/2026', '08:00-10:00',  'CS-CSE301', 'Operating Systems (T-1)',              'Dr. Amit Sharma'],
    [3, '22/08/2026', '08:00-10:00',  'CS-CSE302', 'DBMS (T-1)',                           'Prof. Deepa Nair'],
  ]);
  timetableWs['!cols'] = [
    { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 45 }, { wch: 22 },
  ];

  const instr = XLSX.utils.aoa_to_sheet([
    ['INSTRUCTIONS FOR FILLING CREDIT STRUCTURE'],
    [''],
    ['Sheet 1 — Credit Structure'],
    ['Column', 'Description', 'Example'],
    ['Semester', 'Semester number (1–8)', '1'],
    ['Name Of Course', 'Full course name', 'Engineering Mathematics – I'],
    ['Course Id', 'Unique course code', 'BS-CSE101'],
    ['L', 'Lecture hours per week', '3'],
    ['P', 'Practical/lab hours per week', '2'],
    ['T', 'Tutorial hours per week', '1'],
    ['Credits', 'Total credits for the course', '4'],
    ['T-1', 'First internal test marks', '15'],
    ['T-2', 'Second internal test marks', '15'],
    ['IE', 'Internal evaluation marks (assignments, quiz, lab)', '20'],
    ['Points', 'End semester exam marks', '100'],
    ['Time (Hrs)', 'End semester exam duration', '3'],
    ['End Semester Weightage (%)', 'Percentage weightage of end semester exam', '50'],
    ['Total Points', 'T-1 + T-2 + IE + Points', '150'],
    [''],
    ['Sheet 2 — Program Timetable (key academic dates & exam schedule)'],
    ['Columns: Semester | Date (DD/MM/YYYY) | Time | Course Id | Name Of Course | Faculty'],
    [''],
    ['NOTE: Total Points = (T-1 + T-2 + IE) + End Semester Points × (Weightage/100)'],
  ]);
  instr['!cols'] = [{ wch: 28 }, { wch: 52 }, { wch: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, creditWs,    'Credit Structure');
  XLSX.utils.book_append_sheet(wb, timetableWs, 'Program Timetable');
  XLSX.utils.book_append_sheet(wb, instr,        'Instructions');

  download(wb, 'Sample_Credit_Structure.xlsx');
}

// ── Syllabus ─────────────────────────────────────────────────────────────────
export function downloadSyllabusSample() {
  const rows: any[][] = [
    [
      'Semester', 'Subject Code', 'Subject Name',
      'Module No', 'Module Name', 'Topics Covered', 'Hours',
      'Course Objectives', 'Expected Outcomes',
    ],

    // ════════════════ SEMESTER 1 ════════════════
    // Subject 1 – Engineering Mathematics I
    [
      1, 'BS-CSE101', 'Engineering Mathematics – I',
      1, 'Differential Calculus',
      'Limits & Continuity, Derivatives, Chain Rule, Higher-Order Derivatives, Taylor & Maclaurin Series, Partial Derivatives, Euler\'s Theorem',
      10,
      'Apply differential and integral calculus concepts to engineering problems.\nAnalyse functions using series expansion and multivariable calculus.',
      'Evaluate derivatives and apply to curve sketching and optimisation.\nSolve engineering problems involving partial derivatives and series.',
    ],
    ['','','', 2, 'Integral Calculus', 'Definite & Indefinite Integrals, Integration by Parts, Reduction Formulae, Beta & Gamma Functions, Applications to Area & Volume', 10, '', ''],
    ['','','', 3, 'Vector Calculus',   'Gradient, Divergence, Curl, Green\'s Theorem, Stoke\'s Theorem, Gauss Divergence Theorem, Line & Surface Integrals', 10, '', ''],
    ['','','', 4, 'Complex Numbers',   'Argand Plane, Modulus & Argument, De Moivre\'s Theorem, Roots of Complex Numbers, Cauchy-Riemann Equations, Analytic Functions', 10, '', ''],

    // Subject 2 – Engineering Physics
    [
      1, 'BS-CSE102', 'Engineering Physics',
      1, 'Quantum Mechanics',
      'Wave-Particle Duality, Heisenberg Uncertainty Principle, Schrödinger Equation, Particle in a Box, Quantum Tunnelling',
      10,
      'Understand quantum and laser physics principles relevant to semiconductor and optical devices.\nApply fibre optics and nanotechnology concepts in engineering systems.',
      'Explain quantum mechanical phenomena and their engineering applications.\nAnalyse laser characteristics and fibre optic communication parameters.',
    ],
    ['','','', 2, 'Laser Physics & Fibre Optics', 'Spontaneous & Stimulated Emission, Einstein Coefficients, Ruby Laser, He-Ne Laser, Semiconductor Laser, Types of Optical Fibres, Numerical Aperture, Losses', 10, '', ''],
    ['','','', 3, 'Semiconductor Physics',        'Energy Band Theory, Intrinsic & Extrinsic Semiconductors, p-n Junction, Hall Effect, Zener Diode, LEDs, Solar Cells', 10, '', ''],
    ['','','', 4, 'Nanotechnology',               'Nanoscale Phenomena, Synthesis of Nanomaterials, Carbon Nanotubes, Quantum Dots, Applications in Electronics & Medicine', 10, '', ''],

    // Subject 3 – Problem Solving & Python Programming
    [
      1, 'CS-CSE101', 'Problem Solving & Python Programming',
      1, 'Problem Solving & Algorithms',
      'Computational Thinking, Algorithm Design, Flowcharts, Pseudocode, Complexity Basics (Big-O), Sorting: Bubble, Selection, Insertion',
      8,
      'Develop problem-solving skills using algorithmic thinking and Python programming.\nImplement fundamental data structures and file handling in Python.',
      'Design algorithms and implement them in Python.\nWrite modular Python programs using functions, classes, and exception handling.',
    ],
    ['','','', 2, 'Python Fundamentals',          'Data Types, Variables, Operators, Control Flow (if/elif/else, for, while), Functions, Recursion, Lambda, List Comprehensions', 10, '', ''],
    ['','','', 3, 'Data Structures in Python',    'Lists, Tuples, Sets, Dictionaries, Stacks & Queues using Lists, Linked Lists, Binary Search, Sorting Algorithms', 10, '', ''],
    ['','','', 4, 'OOP & File Handling',          'Classes & Objects, Inheritance, Polymorphism, Encapsulation, Decorators, Iterators, Generators, File I/O, JSON Handling, Exception Handling', 10, '', ''],
    ['','','', 5, 'Python Libraries & Mini Project', 'NumPy, Pandas, Matplotlib Basics, Regular Expressions, Mini Project: CLI-based Student Record System', 8, '', ''],

    // Subject 4 – Digital Logic & Computer Organisation
    [
      1, 'CS-CSE102', 'Digital Logic & Computer Organisation',
      1, 'Number Systems & Boolean Algebra',
      'Binary, Octal, Hexadecimal Conversions, 1s & 2s Complement, Boolean Theorems, De Morgan\'s Laws, Canonical Forms (SOP/POS)',
      8,
      'Design combinational and sequential digital circuits.\nUnderstand computer organisation, memory, and I/O interfaces.',
      'Simplify Boolean expressions using K-Maps and implement with logic gates.\nDesign flip-flops, counters, and understand CPU & memory organisation.',
    ],
    ['','','', 2, 'Combinational Logic Design', 'Logic Gates, Half/Full Adder, Subtractor, Multiplexer, Demultiplexer, Encoder, Decoder, Comparator, K-Map Minimisation', 10, '', ''],
    ['','','', 3, 'Sequential Logic Design',    'SR, JK, D, T Flip-Flops, Registers, Shift Registers, Ripple & Synchronous Counters, FSMs', 10, '', ''],
    ['','','', 4, 'Computer Organisation',      'Von Neumann Architecture, ALU Design, Control Unit, Instruction Cycle, Addressing Modes, Pipelining Basics, Memory Hierarchy, Cache, RAM, ROM', 12, '', ''],

    // ════════════════ SEMESTER 2 ════════════════
    // Subject 5 – Data Structures & Algorithms
    [
      2, 'CS-CSE201', 'Data Structures & Algorithms',
      1, 'Arrays & Linked Lists',
      'Array Operations, Dynamic Arrays, Singly Linked List, Doubly Linked List, Circular Linked List, Insertion/Deletion/Search, Memory Allocation',
      10,
      'Implement fundamental data structures and apply appropriate algorithms for efficient problem solving.\nAnalyse time and space complexity of algorithms.',
      'Implement linked lists, trees, graphs, heaps and use them to solve real-world problems.\nApply sorting and searching algorithms and analyse their performance.',
    ],
    ['','','', 2, 'Stacks, Queues & Recursion',  'Stack Operations & Applications (Infix/Postfix), Queue Types (Simple, Circular, Priority, Dequeue), Recursion, Tower of Hanoi, Backtracking', 10, '', ''],
    ['','','', 3, 'Trees & Binary Search Trees', 'Binary Tree, BST Operations, AVL Tree, Red-Black Tree, B-Tree, Heap, Heap Sort, Priority Queue, Tree Traversals', 12, '', ''],
    ['','','', 4, 'Graph Algorithms',            'Graph Representations, BFS, DFS, Topological Sort, Dijkstra\'s, Bellman-Ford, Floyd-Warshall, Minimum Spanning Tree (Kruskal, Prim)', 12, '', ''],
    ['','','', 5, 'Sorting & Searching',         'Merge Sort, Quick Sort, Radix Sort, Shell Sort, Counting Sort, Binary Search, Hashing, Collision Resolution, Bloom Filters', 10, '', ''],
    ['','','', 6, 'Algorithm Design Paradigms',  'Divide & Conquer, Greedy Algorithms, Dynamic Programming (Knapsack, LCS, Matrix Chain), Amortised Analysis', 10, '', ''],

    // Subject 6 – OOP with Java
    [
      2, 'CS-CSE202', 'Object Oriented Programming with Java',
      1, 'Java Fundamentals',
      'JVM, JRE, JDK, Data Types, Operators, Control Structures, Arrays, Strings, String Buffer, Command-Line Arguments, Varargs',
      8,
      'Understand and apply OOP principles using Java.\nDevelop robust Java applications using exception handling, collections and I/O streams.',
      'Design class hierarchies using inheritance and polymorphism.\nBuild Java applications with collections, generics, and multithreading.',
    ],
    ['','','', 2, 'OOP Concepts',               'Classes & Objects, Constructors, this & static keywords, Method Overloading, Inheritance (single, multi-level, hierarchical), super, Method Overriding, Abstract Classes, Interfaces', 12, '', ''],
    ['','','', 3, 'Exception Handling & I/O',   'Checked & Unchecked Exceptions, try-catch-finally, Custom Exceptions, File I/O (FileReader, FileWriter, BufferedReader), Serialisation, NIO', 10, '', ''],
    ['','','', 4, 'Collections & Generics',     'List, Set, Map, Queue, Iterator, Comparable, Comparator, Generic Classes & Methods, Bounded Wildcards, Java Streams & Lambda', 10, '', ''],
    ['','','', 5, 'Multithreading & Networking', 'Thread Life Cycle, Runnable, Synchronisation, wait/notify, Executor Framework, Socket Programming, UDP, HTTP Basics', 10, '', ''],
    ['','','', 6, 'JavaFX & Mini Project',       'JavaFX UI Components, Event Handling, FXML, Mini Project: Library Management System', 10, '', ''],

    // ════════════════ SEMESTER 3 ════════════════
    // Subject 7 – Operating Systems
    [
      3, 'CS-CSE301', 'Operating Systems',
      1, 'OS Introduction & Process Management',
      'OS Functions & Types, System Calls, Process States, PCB, Context Switching, Threads vs Processes, Multithreading Models, POSIX Threads',
      10,
      'Understand OS principles covering process management, memory management, file systems and I/O.\nAnalyse scheduling algorithms and synchronisation mechanisms.',
      'Implement process scheduling algorithms and evaluate their performance.\nDesign solutions for deadlock avoidance and memory allocation problems.',
    ],
    ['','','', 2, 'CPU Scheduling',             'FCFS, SJF, SRTF, Round Robin, Priority Scheduling, Multilevel Queue, Multilevel Feedback Queue, Real-Time Scheduling, Scheduling Evaluation', 10, '', ''],
    ['','','', 3, 'Process Synchronisation',    'Critical Section Problem, Mutex, Semaphores, Classical Problems (Dining Philosophers, Producer-Consumer, Reader-Writer), Monitors, Deadlock Detection & Avoidance, Banker\'s Algorithm', 12, '', ''],
    ['','','', 4, 'Memory Management',          'Logical vs Physical Address, Contiguous Allocation, Paging, Segmentation, Page Replacement Algorithms (FIFO, LRU, Optimal), Thrashing, Working Set Model', 12, '', ''],
    ['','','', 5, 'File Systems & I/O',         'File Attributes, Directory Structures, FAT, Inode, EXT4, NTFS, Disk Scheduling (SSTF, SCAN, C-SCAN), RAID, I/O Subsystem, Buffering & Caching', 10, '', ''],

    // Subject 8 – Database Management Systems
    [
      3, 'CS-CSE302', 'Database Management Systems',
      1, 'Relational Model & SQL Fundamentals',
      'DBMS Architecture, Relational Model, Keys, Integrity Constraints, SQL DDL/DML (CREATE, SELECT, INSERT, UPDATE, DELETE), Aggregate Functions, Joins',
      10,
      'Design relational databases using ER modelling and normalisation.\nWrite complex SQL queries and understand transaction management principles.',
      'Create normalised database schemas from real-world requirements.\nImplemente transactions, triggers, and optimise queries using indexing.',
    ],
    ['','','', 2, 'Advanced SQL',               'Subqueries, Nested Queries, Views, Stored Procedures, Triggers, Cursors, Window Functions (RANK, ROW_NUMBER), CTEs, EXPLAIN PLAN', 10, '', ''],
    ['','','', 3, 'ER Modelling & Normalisation','Entity-Relationship Diagrams, Mapping ER to Relational, Functional Dependencies, 1NF, 2NF, 3NF, BCNF, 4NF, Denormalisation', 10, '', ''],
    ['','','', 4, 'Transaction Management',     'ACID Properties, Concurrency Control (2PL, MVCC), Isolation Levels, Deadlock in DBMS, Recovery Techniques (Undo/Redo, Checkpointing), Write-Ahead Logging', 10, '', ''],
    ['','','', 5, 'NoSQL & Indexing',           'NoSQL Categories (Document, Key-Value, Column, Graph), MongoDB Basics, Redis, B+ Tree Index, Hash Index, Query Optimisation, Database Security & Encryption', 10, '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 10 }, { wch: 12 }, { wch: 40 },
    { wch: 10 }, { wch: 36 }, { wch: 70 }, { wch: 7 },
    { wch: 55 }, { wch: 55 },
  ];

  const instr = XLSX.utils.aoa_to_sheet([
    ['INSTRUCTIONS FOR FILLING SYLLABUS / COURSE CONTENT'],
    [''],
    ['Column', 'Description', 'Example'],
    ['Semester', 'Semester number (fill ONLY on first module row of each subject)', '1'],
    ['Subject Code', 'Unique subject code (fill ONLY on first module row)', 'BS-CSE101'],
    ['Subject Name', 'Full subject name (fill ONLY on first module row)', 'Engineering Mathematics – I'],
    ['Module No', 'Sequential module number within the subject', '1'],
    ['Module Name', 'Title of the module', 'Differential Calculus'],
    ['Topics Covered', 'Comma-separated topics covered in this module', 'Limits, Derivatives, Chain Rule'],
    ['Hours', 'Teaching hours allocated for this module', '10'],
    ['Course Objectives', 'Course-level objectives — fill ONLY on the first module row, use newline to separate', 'Apply calculus to engineering problems.'],
    ['Expected Outcomes', 'What students will achieve — fill ONLY on the first module row', 'Evaluate derivatives and apply to optimisation.'],
    [''],
    ['IMPORTANT RULES:'],
    ['1. Leave Semester, Subject Code, Subject Name, Course Objectives, Expected Outcomes BLANK for rows 2, 3, 4… of the same subject.'],
    ['2. The system groups rows by Subject Code to build the curriculum tree — Subject Code must be consistent across all module rows of a subject.'],
    ['3. One row per module. Do not combine multiple modules in one row.'],
  ]);
  instr['!cols'] = [{ wch: 24 }, { wch: 65 }, { wch: 42 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws,    'Syllabus');
  XLSX.utils.book_append_sheet(wb, instr, 'Instructions');

  download(wb, 'Sample_Syllabus.xlsx');
}

// ── Program Calendar / Weekly Timetable ──────────────────────────────────────
export function downloadCalendarSample() {
  const timetableWs = XLSX.utils.aoa_to_sheet([
    ['Day', 'Start Time', 'End Time', 'Course Code', 'Course Name', 'Faculty', 'Room'],
    // Monday
    ['Monday', '08:00', '09:00', 'BS-CSE101', 'Engineering Mathematics – I',           'Dr. Rajesh Kumar',  'LH-101'],
    ['Monday', '09:00', '10:00', 'CS-CSE101', 'Problem Solving & Python Programming',  'Dr. Priya Mehta',   'LH-102'],
    ['Monday', '10:00', '11:00', 'CS-CSE102', 'Digital Logic & Computer Organisation', 'Dr. Suresh Nair',   'LH-103'],
    ['Monday', '11:00', '12:00', 'BS-CSE102', 'Engineering Physics',                   'Prof. Ananya Singh','LH-101'],
    ['Monday', '14:00', '16:00', 'CS-CSE101', 'Python Programming Lab',                'Dr. Priya Mehta',   'CS-Lab-1'],
    // Tuesday
    ['Tuesday', '08:00', '09:00', 'CS-CSE201', 'Data Structures & Algorithms',         'Dr. Kiran Desai',   'LH-201'],
    ['Tuesday', '09:00', '10:00', 'CS-CSE202', 'OOP with Java',                        'Prof. Meera Iyer',  'LH-202'],
    ['Tuesday', '10:00', '11:00', 'BS-CSE201', 'Engineering Mathematics – II',         'Dr. Rajesh Kumar',  'LH-201'],
    ['Tuesday', '11:00', '12:00', 'CS-CSE301', 'Operating Systems',                    'Dr. Amit Sharma',   'LH-301'],
    ['Tuesday', '14:00', '16:00', 'CS-CSE201', 'Data Structures Lab',                  'Dr. Kiran Desai',   'CS-Lab-2'],
    // Wednesday
    ['Wednesday', '08:00', '09:00', 'CS-CSE302', 'Database Management Systems',        'Prof. Deepa Nair',  'LH-302'],
    ['Wednesday', '09:00', '10:00', 'CS-CSE303', 'Computer Networks',                  'Dr. Vinod Rao',     'LH-303'],
    ['Wednesday', '10:00', '11:00', 'CS-CSE101', 'Problem Solving & Python',           'Dr. Priya Mehta',   'LH-102'],
    ['Wednesday', '11:00', '12:00', 'BS-CSE101', 'Engineering Mathematics – I',        'Dr. Rajesh Kumar',  'LH-101'],
    ['Wednesday', '14:00', '16:00', 'CS-CSE202', 'Java Programming Lab',               'Prof. Meera Iyer',  'CS-Lab-1'],
    // Thursday
    ['Thursday', '08:00', '09:00', 'CS-CSE102', 'Digital Logic & Computer Organisation','Dr. Suresh Nair',  'LH-103'],
    ['Thursday', '09:00', '10:00', 'CS-CSE301', 'Operating Systems',                   'Dr. Amit Sharma',   'LH-301'],
    ['Thursday', '10:00', '11:00', 'CS-CSE302', 'Database Management Systems',         'Prof. Deepa Nair',  'LH-302'],
    ['Thursday', '11:00', '12:00', 'CS-CSE201', 'Data Structures & Algorithms',        'Dr. Kiran Desai',   'LH-201'],
    ['Thursday', '14:00', '16:00', 'CS-CSE302', 'DBMS Lab',                            'Prof. Deepa Nair',  'CS-Lab-2'],
    // Friday
    ['Friday', '08:00', '09:00', 'BS-CSE102', 'Engineering Physics',                   'Prof. Ananya Singh','LH-101'],
    ['Friday', '09:00', '10:00', 'CS-CSE202', 'OOP with Java',                         'Prof. Meera Iyer',  'LH-202'],
    ['Friday', '10:00', '11:00', 'CS-CSE303', 'Computer Networks',                     'Dr. Vinod Rao',     'LH-303'],
    ['Friday', '11:00', '12:00', 'HS-CSE101', 'Communication Skills in English',       'Prof. Kavitha Rao', 'LH-104'],
    ['Friday', '14:00', '16:00', 'BS-CSE102', 'Engineering Physics Lab',               'Prof. Ananya Singh','Physics-Lab'],
    // Saturday
    ['Saturday', '09:00', '10:00', 'ES-CSE101', 'Engineering Graphics & Visualization','Prof. Ravi Verma',  'Drawing Hall'],
    ['Saturday', '10:00', '12:00', 'ES-CSE101', 'Engineering Graphics Lab',            'Prof. Ravi Verma',  'Drawing Hall'],
    ['Saturday', '14:00', '15:00', 'CS-CSE301', 'Operating Systems (Tutorial)',        'Dr. Amit Sharma',   'LH-301'],
  ]);
  timetableWs['!cols'] = [
    { wch: 11 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 44 }, { wch: 22 }, { wch: 14 },
  ];

  const calendarWs = XLSX.utils.aoa_to_sheet([
    ['Week No', 'Date Range', 'Semester', 'Activity Type', 'Description', 'Remarks'],
    // Semester 1
    [ 1, '01 Jul – 05 Jul 2025', 'Semester 1', 'Instruction',         'Commencement of classes – Semester 1',                         'Attendance mandatory from Day 1'],
    [ 2, '07 Jul – 12 Jul 2025', 'Semester 1', 'Instruction',         'Regular instruction – all subjects',                           ''],
    [ 3, '14 Jul – 19 Jul 2025', 'Semester 1', 'Instruction',         'Regular instruction',                                          'Lab sessions begin'],
    [ 4, '21 Jul – 26 Jul 2025', 'Semester 1', 'Instruction',         'Regular instruction',                                          ''],
    [ 5, '28 Jul – 02 Aug 2025', 'Semester 1', 'Event',               'Freshers Orientation & Cultural Program',                      'Attendance: 75% mandatory'],
    [ 6, '04 Aug – 09 Aug 2025', 'Semester 1', 'Instruction',         'Regular instruction',                                          ''],
    [ 7, '11 Aug – 16 Aug 2025', 'Semester 1', 'Holiday',             'Independence Day & Onam Holidays',                             '15 Aug public holiday'],
    [ 8, '18 Aug – 23 Aug 2025', 'Semester 1', 'Internal Assessment', 'Test 1 (T-1) – All Subjects',                                  '15 marks each; 1-hour test'],
    [ 9, '25 Aug – 30 Aug 2025', 'Semester 1', 'Instruction',         'Regular instruction – post T-1',                               'Test papers returned with feedback'],
    [10, '01 Sep – 06 Sep 2025', 'Semester 1', 'Event',               'TechFest 2025 – Annual Technical Symposium',                   'Inter-college participation encouraged'],
    [11, '08 Sep – 13 Sep 2025', 'Semester 1', 'Instruction',         'Regular instruction',                                          ''],
    [12, '15 Sep – 20 Sep 2025', 'Semester 1', 'Instruction',         'Regular instruction',                                          ''],
    [13, '22 Sep – 27 Sep 2025', 'Semester 1', 'Internal Assessment', 'Test 2 (T-2) – All Subjects',                                  '15 marks each; 1-hour test'],
    [14, '29 Sep – 04 Oct 2025', 'Semester 1', 'Revision',            'Completion of syllabus & revision classes',                    'Extra sessions for weak students'],
    [15, '06 Oct – 11 Oct 2025', 'Semester 1', 'Revision',            'Preparatory leave – no regular classes',                       'Library open 8am–8pm'],
    [16, '13 Oct – 25 Oct 2025', 'Semester 1', 'End Semester Exam',   'End Semester Examinations – Semester 1',                       'Refer separate timetable'],
    [17, '27 Oct – 31 Oct 2025', 'Semester 1', 'Holiday',             'Diwali Vacation',                                              ''],
    [18, '03 Nov 2025',          'Semester 1', 'Result',              'Semester 1 Results Declaration on ERP portal',                 'Contact HOD for revaluation queries'],
    // Semester 2
    [19, '03 Nov – 08 Nov 2025', 'Semester 2', 'Instruction',         'Commencement of Semester 2',                                   ''],
    [20, '10 Nov – 15 Nov 2025', 'Semester 2', 'Instruction',         'Regular instruction',                                          ''],
    [24, '08 Dec – 13 Dec 2025', 'Semester 2', 'Holiday',             'Christmas & New Year Break',                                   '25 Dec – 01 Jan holiday'],
    [26, '05 Jan – 10 Jan 2026', 'Semester 2', 'Instruction',         'Classes resume post holidays',                                 ''],
    [28, '19 Jan – 24 Jan 2026', 'Semester 2', 'Internal Assessment', 'Test 1 (T-1) – Semester 2 subjects',                          '15 marks each'],
    [32, '16 Feb – 21 Feb 2026', 'Semester 2', 'Event',               'Hackathon & Project Exhibition',                               'Industry judges invited'],
    [34, '02 Mar – 07 Mar 2026', 'Semester 2', 'Internal Assessment', 'Test 2 (T-2) – Semester 2 subjects',                          '15 marks each'],
    [36, '16 Mar – 21 Mar 2026', 'Semester 2', 'Revision',            'Syllabus completion & preparatory leave',                      ''],
    [37, '23 Mar – 11 Apr 2026', 'Semester 2', 'End Semester Exam',   'End Semester Examinations – Semester 2',                       'Refer separate timetable'],
    [38, '13 Apr – 20 Apr 2026', 'Semester 2', 'Holiday',             'Summer Vacation begins',                                       ''],
    [39, '27 Apr 2026',          'Semester 2', 'Result',              'Semester 2 Results Declaration',                               ''],
    // Semester 3
    [40, '01 Jul – 05 Jul 2026', 'Semester 3', 'Instruction',         'Commencement of Semester 3',                                   'Core CSE subjects begin'],
    [44, '27 Jul – 01 Aug 2026', 'Semester 3', 'Event',               'Industry Connect Week – Guest Lectures & Company Visits',      'Mandatory for all students'],
    [46, '10 Aug – 15 Aug 2026', 'Semester 3', 'Internal Assessment', 'Test 1 (T-1) – Semester 3',                                   ''],
    [50, '07 Sep – 12 Sep 2026', 'Semester 3', 'Internal Assessment', 'Test 2 (T-2) – Semester 3',                                   ''],
    [52, '21 Sep – 26 Sep 2026', 'Semester 3', 'Event',               'National Coding Contest – ICPC Regionals Preparation',         'Selective participation'],
    [54, '05 Oct – 10 Oct 2026', 'Semester 3', 'Revision',            'Syllabus completion & preparatory leave',                      ''],
    [55, '12 Oct – 31 Oct 2026', 'Semester 3', 'End Semester Exam',   'End Semester Examinations – Semester 3',                       ''],
    [56, '02 Nov 2026',          'Semester 3', 'Result',              'Semester 3 Results Declaration',                               ''],
  ]);
  calendarWs['!cols'] = [
    { wch: 8 }, { wch: 24 }, { wch: 12 }, { wch: 22 }, { wch: 52 }, { wch: 32 },
  ];

  const instr = XLSX.utils.aoa_to_sheet([
    ['INSTRUCTIONS FOR FILLING PROGRAM CALENDAR'],
    [''],
    ['Sheet 1 — Weekly Timetable (renders as a monthly class schedule calendar in the portal)'],
    ['Column', 'Description', 'Example'],
    ['Day', 'Day of week — Monday / Tuesday / Wednesday / Thursday / Friday / Saturday / Sunday', 'Monday'],
    ['Start Time', 'Class start time in HH:MM (24-hour format)', '08:00'],
    ['End Time', 'Class end time in HH:MM (24-hour format)', '09:00'],
    ['Course Code', 'Course identifier matching Credit Structure sheet', 'BS-CSE101'],
    ['Course Name', 'Full course name (can include "Lab" suffix for practical)', 'Python Programming Lab'],
    ['Faculty', 'Faculty name', 'Dr. Priya Mehta'],
    ['Room', 'Room, lab, or hall number', 'CS-Lab-1'],
    [''],
    ['Sheet 2 — Academic Calendar (events, holidays, internal tests, end semester exams)'],
    ['Column', 'Description'],
    ['Week No', 'Sequential week number in the full academic year'],
    ['Date Range', 'Date range for the event (DD Mon YYYY – DD Mon YYYY)'],
    ['Semester', 'Semester this activity belongs to (Semester 1 / 2 / 3 …)'],
    ['Activity Type', 'One of: Instruction / Internal Assessment / End Semester Exam / Event / Holiday / Revision / Result'],
    ['Description', 'Brief, descriptive name of the activity'],
    ['Remarks', 'Additional notes, references or instructions'],
    [''],
    ['NOTE: The weekly timetable repeats every week and is used to show recurring classes on the monthly calendar.'],
    ['Academic Calendar events are overlaid on top for exams, holidays, and events.'],
  ]);
  instr['!cols'] = [{ wch: 14 }, { wch: 65 }, { wch: 22 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, timetableWs, 'Weekly Timetable');
  XLSX.utils.book_append_sheet(wb, calendarWs,  'Academic Calendar');
  XLSX.utils.book_append_sheet(wb, instr,        'Instructions');

  download(wb, 'Sample_Program_Calendar.xlsx');
}
