const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper function to generate random Vietnamese names
function generateVietnameseName() {
  const ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
  const dem = ['Văn', 'Thị', 'Minh', 'Hoàng', 'Hữu', 'Đức', 'Thanh', 'Quốc', 'Anh', 'Thùy', 'Ngọc', 'Phương', 'Hải', 'Xuân', 'Thu', 'Tấn'];
  const ten = ['An', 'Bình', 'Chi', 'Dũng', 'Em', 'Phúc', 'Giang', 'Hà', 'Khang', 'Linh', 'Mai', 'Nam', 'Oanh', 'Phong', 'Quang', 'Sơn', 'Tâm', 'Uyên', 'Việt', 'Yến', 'Thảo', 'Hùng', 'Trang', 'Tuấn', 'Hương', 'Đạt', 'Kiên', 'Long', 'Nhung', 'Trung'];
  
  return `${ho[Math.floor(Math.random() * ho.length)]} ${dem[Math.floor(Math.random() * dem.length)]} ${ten[Math.floor(Math.random() * ten.length)]}`;
}

// Helper to generate phone number
function generatePhone(index) {
  const prefixes = ['090', '091', '093', '094', '096', '097', '098', '099', '086', '088', '089'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}${String(index).padStart(7, '0')}`;
}

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // ============================================
  // 1. Create Admin user
  // ============================================
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@learnhub.com' },
    update: {},
    create: {
      email: 'admin@learnhub.com',
      password: adminPassword,
      name: 'Administrator',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log('✓ Admin created:', admin.email);

  // ============================================
  // 2. Create 5 Teachers
  // ============================================
  console.log('\n👨‍🏫 Creating 5 teachers...');
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  
  const teachersData = [
    { email: 'teacher1@example.com', name: 'PGS.TS Nguyễn Văn Hùng', phone: '0911111111' },
    { email: 'teacher2@example.com', name: 'TS. Trần Thị Lan', phone: '0922222222' },
    { email: 'teacher3@example.com', name: 'ThS. Lê Minh Đức', phone: '0933333333' },
    { email: 'teacher4@example.com', name: 'TS. Phạm Hoàng Nam', phone: '0944444444' },
    { email: 'teacher5@example.com', name: 'ThS. Hoàng Thu Hương', phone: '0955555555' },
  ];

  const teachers = [];
  for (const t of teachersData) {
    const teacher = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        password: teacherPassword,
        name: t.name,
        phone: t.phone,
        role: 'TEACHER',
        status: 'ACTIVE'
      }
    });
    teachers.push(teacher);
    console.log(`  ✓ ${teacher.name}`);
  }
  console.log('✓ Created 5 teachers with password: teacher123');

  // ============================================
  // 3. Create 40 Students
  // ============================================
  console.log('\n👥 Creating 40 students...');
  const studentPassword = await bcrypt.hash('123456', 10);
  
  const students = [];
  
  // Create 40 students with various statuses
  for (let i = 1; i <= 40; i++) {
    const name = generateVietnameseName();
    const email = `student${i}@example.com`;
    const phone = generatePhone(1000000 + i);
    
    // Most students are ACTIVE, some PENDING
    let status = 'ACTIVE';
    if (i >= 38) status = 'PENDING'; // Last 3 are pending
    
    const student = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: studentPassword,
        name,
        phone,
        role: 'USER',
        status
      }
    });
    students.push(student);
    
    if (i % 10 === 0) {
      console.log(`  ✓ Created ${i} students...`);
    }
  }
  console.log('✓ Created 40 students with password: 123456');

  // ============================================
  // 4. Create Majors (6 majors)
  // ============================================
  console.log('\n🎓 Creating majors...');
  
  const majorsData = [
    { name: 'Công nghệ thông tin', description: 'Ngành đào tạo về lập trình, phát triển phần mềm và hệ thống thông tin. Sinh viên được trang bị kiến thức từ cơ bản đến nâng cao về các ngôn ngữ lập trình, database, web development và mobile development.', order: 1 },
    { name: 'Kỹ thuật phần mềm', description: 'Ngành đào tạo về quy trình phát triển phần mềm chuyên nghiệp, bao gồm Agile/Scrum, testing, DevOps và CI/CD. Tập trung vào kỹ năng làm việc nhóm và quản lý dự án.', order: 2 },
    { name: 'Khoa học dữ liệu', description: 'Ngành đào tạo về phân tích dữ liệu, machine learning và AI. Học viên sẽ thành thạo Python, R, SQL và các công cụ visualization như Tableau, Power BI.', order: 3 },
    { name: 'An ninh mạng', description: 'Ngành đào tạo về bảo mật hệ thống, ethical hacking, mã hóa và phòng chống tấn công mạng. Phù hợp với những ai đam mê lĩnh vực cybersecurity.', order: 4 },
    { name: 'Thiết kế đồ họa & UI/UX', description: 'Ngành đào tạo về thiết kế giao diện, trải nghiệm người dùng, đồ họa sáng tạo. Sử dụng Figma, Adobe XD, Photoshop, Illustrator.', order: 5 },
    { name: 'Marketing số', description: 'Ngành đào tạo về Digital Marketing, SEO/SEM, Social Media Marketing, Content Marketing và Analytics. Phù hợp với xu hướng kinh doanh online.', order: 6 },
  ];

  const majors = [];
  for (const m of majorsData) {
    const major = await prisma.major.create({ data: m });
    majors.push(major);
    console.log(`  ✓ ${major.name}`);
  }
  console.log('✓ Created 6 majors');

  // ============================================
  // 5. Create Subjects (nhiều môn, tập trung vào teacher 1 và 2)
  // ============================================
  console.log('\n📚 Creating subjects...');

  // === CÔNG NGHỆ THÔNG TIN (major 0) - Teacher 1 & 2 phụ trách chính ===
  const subject_cntt_1 = await prisma.subject.create({
    data: {
      majorId: majors[0].id,
      teacherId: teachers[0].id, // Teacher 1
      name: 'Nhập môn lập trình',
      description: 'Học các khái niệm cơ bản về lập trình: biến, kiểu dữ liệu, câu lệnh điều kiện, vòng lặp. Sử dụng ngôn ngữ Python.',
      order: 1
    }
  });

  const subject_cntt_2 = await prisma.subject.create({
    data: {
      majorId: majors[0].id,
      teacherId: teachers[0].id, // Teacher 1
      name: 'Cấu trúc dữ liệu và giải thuật',
      description: 'Mảng, linked list, stack, queue, tree, graph. Các thuật toán sắp xếp, tìm kiếm và quy hoạch động.',
      prerequisiteId: subject_cntt_1.id,
      order: 2
    }
  });

  const subject_cntt_3 = await prisma.subject.create({
    data: {
      majorId: majors[0].id,
      teacherId: teachers[0].id, // Teacher 1
      name: 'Lập trình hướng đối tượng (OOP)',
      description: 'Class, Object, Encapsulation, Inheritance, Polymorphism, Abstraction. Áp dụng với Java và Python.',
      prerequisiteId: subject_cntt_1.id,
      order: 3
    }
  });

  const subject_cntt_4 = await prisma.subject.create({
    data: {
      majorId: majors[0].id,
      teacherId: teachers[1].id, // Teacher 2
      name: 'Cơ sở dữ liệu',
      description: 'SQL, MySQL, PostgreSQL. Thiết kế database, ERD, normalization, indexing và query optimization.',
      prerequisiteId: subject_cntt_1.id,
      order: 4
    }
  });

  const subject_cntt_5 = await prisma.subject.create({
    data: {
      majorId: majors[0].id,
      teacherId: teachers[1].id, // Teacher 2
      name: 'Lập trình Web Frontend',
      description: 'HTML5, CSS3, JavaScript ES6+, React.js. Responsive design và modern web development.',
      prerequisiteId: subject_cntt_3.id,
      order: 5
    }
  });

  const subject_cntt_6 = await prisma.subject.create({
    data: {
      majorId: majors[0].id,
      teacherId: teachers[1].id, // Teacher 2
      name: 'Lập trình Web Backend',
      description: 'Node.js, Express.js, RESTful API, Authentication, Authorization. Kết nối database và deployment.',
      prerequisiteId: subject_cntt_4.id,
      order: 6
    }
  });

  const subject_cntt_7 = await prisma.subject.create({
    data: {
      majorId: majors[0].id,
      teacherId: teachers[0].id, // Teacher 1
      name: 'Lập trình Mobile với React Native',
      description: 'Xây dựng ứng dụng mobile cross-platform với React Native. UI components, navigation, và native modules.',
      prerequisiteId: subject_cntt_5.id,
      order: 7
    }
  });

  // === KỸ THUẬT PHẦN MỀM (major 1) - Teacher 1 & 2 ===
  const subject_ktpm_1 = await prisma.subject.create({
    data: {
      majorId: majors[1].id,
      teacherId: teachers[0].id, // Teacher 1
      name: 'Quy trình phát triển phần mềm',
      description: 'Waterfall, Agile, Scrum, Kanban. Quản lý dự án với Jira, Trello. Sprint planning và retrospective.',
      order: 1
    }
  });

  const subject_ktpm_2 = await prisma.subject.create({
    data: {
      majorId: majors[1].id,
      teacherId: teachers[1].id, // Teacher 2
      name: 'Kiểm thử phần mềm',
      description: 'Unit testing, Integration testing, E2E testing. Jest, Mocha, Selenium. Test-Driven Development (TDD).',
      prerequisiteId: subject_ktpm_1.id,
      order: 2
    }
  });

  const subject_ktpm_3 = await prisma.subject.create({
    data: {
      majorId: majors[1].id,
      teacherId: teachers[1].id, // Teacher 2
      name: 'DevOps và CI/CD',
      description: 'Docker, Kubernetes, Jenkins, GitHub Actions. Infrastructure as Code, monitoring và logging.',
      prerequisiteId: subject_ktpm_2.id,
      order: 3
    }
  });

  const subject_ktpm_4 = await prisma.subject.create({
    data: {
      majorId: majors[1].id,
      teacherId: teachers[0].id, // Teacher 1
      name: 'Kiến trúc phần mềm',
      description: 'Microservices, Monolithic, Clean Architecture, Domain-Driven Design. System design và scalability.',
      prerequisiteId: subject_ktpm_1.id,
      order: 4
    }
  });

  // === KHOA HỌC DỮ LIỆU (major 2) - Teacher 2 & 3 ===
  const subject_ds_1 = await prisma.subject.create({
    data: {
      majorId: majors[2].id,
      teacherId: teachers[1].id, // Teacher 2 cũng dạy Data Science
      name: 'Python cho Data Science',
      description: 'Python cơ bản, NumPy, Pandas, Matplotlib, Seaborn. Xử lý và visualization dữ liệu.',
      order: 1
    }
  });

  const subject_ds_2 = await prisma.subject.create({
    data: {
      majorId: majors[2].id,
      teacherId: teachers[2].id, // Teacher 3
      name: 'Thống kê và Xác suất',
      description: 'Thống kê mô tả, xác suất, phân phối, kiểm định giả thuyết. Ứng dụng trong phân tích dữ liệu.',
      order: 2
    }
  });

  const subject_ds_3 = await prisma.subject.create({
    data: {
      majorId: majors[2].id,
      teacherId: teachers[2].id, // Teacher 3
      name: 'Machine Learning cơ bản',
      description: 'Linear Regression, Logistic Regression, Decision Tree, Random Forest, SVM. Scikit-learn.',
      prerequisiteId: subject_ds_1.id,
      order: 3
    }
  });

  const subject_ds_4 = await prisma.subject.create({
    data: {
      majorId: majors[2].id,
      teacherId: teachers[2].id, // Teacher 3
      name: 'Deep Learning',
      description: 'Neural Networks, CNN, RNN, LSTM, Transformer. TensorFlow và PyTorch.',
      prerequisiteId: subject_ds_3.id,
      order: 4
    }
  });

  const subject_ds_5 = await prisma.subject.create({
    data: {
      majorId: majors[2].id,
      teacherId: teachers[2].id, // Teacher 3
      name: 'Big Data và Cloud',
      description: 'Apache Spark, Hadoop, AWS, GCP. Xử lý dữ liệu lớn trên cloud platform.',
      prerequisiteId: subject_ds_3.id,
      order: 5
    }
  });

  // === AN NINH MẠNG (major 3) - Teacher 1 & 4 ===
  const subject_anm_1 = await prisma.subject.create({
    data: {
      majorId: majors[3].id,
      teacherId: teachers[0].id, // Teacher 1 cũng dạy An ninh mạng
      name: 'Cơ sở an ninh mạng',
      description: 'Các khái niệm bảo mật, CIA Triad, Authentication, Authorization. Threat modeling.',
      order: 1
    }
  });

  const subject_anm_2 = await prisma.subject.create({
    data: {
      majorId: majors[3].id,
      teacherId: teachers[3].id, // Teacher 4
      name: 'Mã hóa và bảo mật',
      description: 'Symmetric/Asymmetric encryption, Hashing, Digital signatures, PKI, SSL/TLS.',
      prerequisiteId: subject_anm_1.id,
      order: 2
    }
  });

  const subject_anm_3 = await prisma.subject.create({
    data: {
      majorId: majors[3].id,
      teacherId: teachers[3].id, // Teacher 4
      name: 'Ethical Hacking',
      description: 'Penetration testing, Vulnerability assessment, Kali Linux, Metasploit, Burp Suite.',
      prerequisiteId: subject_anm_2.id,
      order: 3
    }
  });

  const subject_anm_4 = await prisma.subject.create({
    data: {
      majorId: majors[3].id,
      teacherId: teachers[3].id, // Teacher 4
      name: 'Bảo mật ứng dụng Web',
      description: 'OWASP Top 10, SQL Injection, XSS, CSRF, Security Headers, WAF.',
      prerequisiteId: subject_anm_1.id,
      order: 4
    }
  });

  // === THIẾT KẾ ĐỒ HỌA & UI/UX (major 4) - Teacher 5 ===
  const subject_design_1 = await prisma.subject.create({
    data: {
      majorId: majors[4].id,
      teacherId: teachers[4].id, // Teacher 5
      name: 'Nguyên lý thiết kế',
      description: 'Color theory, Typography, Layout, Composition, Visual hierarchy. Gestalt principles.',
      order: 1
    }
  });

  const subject_design_2 = await prisma.subject.create({
    data: {
      majorId: majors[4].id,
      teacherId: teachers[4].id, // Teacher 5
      name: 'Adobe Photoshop & Illustrator',
      description: 'Chỉnh sửa ảnh, thiết kế vector, logo design, poster và ấn phẩm marketing.',
      prerequisiteId: subject_design_1.id,
      order: 2
    }
  });

  const subject_design_3 = await prisma.subject.create({
    data: {
      majorId: majors[4].id,
      teacherId: teachers[4].id, // Teacher 5
      name: 'UI/UX Design',
      description: 'User Research, Wireframing, Prototyping, Usability Testing. Figma và Adobe XD.',
      prerequisiteId: subject_design_1.id,
      order: 3
    }
  });

  const subject_design_4 = await prisma.subject.create({
    data: {
      majorId: majors[4].id,
      teacherId: teachers[4].id, // Teacher 5
      name: 'Motion Graphics',
      description: 'After Effects, animation principles, video editing, intro và outro design.',
      prerequisiteId: subject_design_2.id,
      order: 4
    }
  });

  // === MARKETING SỐ (major 5) - Teacher 2 & 5 ===
  const subject_mkt_1 = await prisma.subject.create({
    data: {
      majorId: majors[5].id,
      teacherId: teachers[1].id, // Teacher 2
      name: 'Digital Marketing căn bản',
      description: 'Tổng quan digital marketing, customer journey, marketing funnel, KPIs và metrics.',
      order: 1
    }
  });

  const subject_mkt_2 = await prisma.subject.create({
    data: {
      majorId: majors[5].id,
      teacherId: teachers[1].id, // Teacher 2
      name: 'SEO & SEM',
      description: 'On-page SEO, Off-page SEO, Technical SEO, Google Ads, Keyword research, Analytics.',
      prerequisiteId: subject_mkt_1.id,
      order: 2
    }
  });

  const subject_mkt_3 = await prisma.subject.create({
    data: {
      majorId: majors[5].id,
      teacherId: teachers[4].id, // Teacher 5
      name: 'Social Media Marketing',
      description: 'Facebook Ads, Instagram, TikTok, LinkedIn. Content calendar, community management.',
      prerequisiteId: subject_mkt_1.id,
      order: 3
    }
  });

  const subject_mkt_4 = await prisma.subject.create({
    data: {
      majorId: majors[5].id,
      teacherId: teachers[4].id, // Teacher 5
      name: 'Content Marketing & Copywriting',
      description: 'Content strategy, storytelling, copywriting formulas, email marketing, blog writing.',
      prerequisiteId: subject_mkt_1.id,
      order: 4
    }
  });

  // Collect all subjects for easy reference
  const allSubjects = [
    subject_cntt_1, subject_cntt_2, subject_cntt_3, subject_cntt_4, subject_cntt_5, subject_cntt_6, subject_cntt_7,
    subject_ktpm_1, subject_ktpm_2, subject_ktpm_3, subject_ktpm_4,
    subject_ds_1, subject_ds_2, subject_ds_3, subject_ds_4, subject_ds_5,
    subject_anm_1, subject_anm_2, subject_anm_3, subject_anm_4,
    subject_design_1, subject_design_2, subject_design_3, subject_design_4,
    subject_mkt_1, subject_mkt_2, subject_mkt_3, subject_mkt_4
  ];

  console.log(`✓ Created ${allSubjects.length} subjects`);

  // ============================================
  // 6. Create Lessons for each subject
  // ============================================
  console.log('\n📖 Creating lessons...');
  
  const videoUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
  ];

  let lessonCount = 0;
  const allLessons = [];

  // Create lessons for CNTT subjects (detailed)
  const cnttLessons = [
    // Nhập môn lập trình
    { subjectId: subject_cntt_1.id, name: 'Giới thiệu về lập trình', description: 'Lập trình là gì? Tại sao cần học lập trình?', order: 1, duration: 1800 },
    { subjectId: subject_cntt_1.id, name: 'Biến và kiểu dữ liệu', description: 'Int, float, string, boolean và cách khai báo biến', order: 2, duration: 2400 },
    { subjectId: subject_cntt_1.id, name: 'Câu lệnh điều kiện if-else', description: 'Điều kiện, toán tử so sánh, if-elif-else', order: 3, duration: 2100 },
    { subjectId: subject_cntt_1.id, name: 'Vòng lặp for và while', description: 'Lặp qua dữ liệu, break và continue', order: 4, duration: 2700 },
    { subjectId: subject_cntt_1.id, name: 'Hàm trong Python', description: 'Định nghĩa hàm, tham số, return value', order: 5, duration: 3000 },
    
    // Cấu trúc dữ liệu
    { subjectId: subject_cntt_2.id, name: 'Mảng và List', description: 'Array, ArrayList, operations và complexity', order: 1, duration: 2400 },
    { subjectId: subject_cntt_2.id, name: 'Linked List', description: 'Singly linked list, doubly linked list', order: 2, duration: 2700 },
    { subjectId: subject_cntt_2.id, name: 'Stack và Queue', description: 'LIFO, FIFO, ứng dụng thực tế', order: 3, duration: 2400 },
    { subjectId: subject_cntt_2.id, name: 'Thuật toán sắp xếp', description: 'Bubble sort, Quick sort, Merge sort', order: 4, duration: 3600 },
    
    // OOP
    { subjectId: subject_cntt_3.id, name: 'Class và Object', description: 'Định nghĩa class, tạo object, constructor', order: 1, duration: 2400 },
    { subjectId: subject_cntt_3.id, name: 'Encapsulation', description: 'Private, public, protected, getter/setter', order: 2, duration: 2100 },
    { subjectId: subject_cntt_3.id, name: 'Inheritance', description: 'Kế thừa, super class, override methods', order: 3, duration: 2700 },
    { subjectId: subject_cntt_3.id, name: 'Polymorphism', description: 'Đa hình, interface, abstract class', order: 4, duration: 3000 },
    
    // Database
    { subjectId: subject_cntt_4.id, name: 'Giới thiệu SQL', description: 'Relational database, tables, keys', order: 1, duration: 2100 },
    { subjectId: subject_cntt_4.id, name: 'CRUD Operations', description: 'SELECT, INSERT, UPDATE, DELETE', order: 2, duration: 2700 },
    { subjectId: subject_cntt_4.id, name: 'JOIN và Subqueries', description: 'INNER JOIN, LEFT JOIN, subquery', order: 3, duration: 3000 },
    { subjectId: subject_cntt_4.id, name: 'Database Design', description: 'ERD, Normalization, Indexing', order: 4, duration: 3600 },
    
    // Frontend
    { subjectId: subject_cntt_5.id, name: 'HTML5 cơ bản', description: 'Tags, attributes, semantic HTML', order: 1, duration: 2400 },
    { subjectId: subject_cntt_5.id, name: 'CSS3 và Flexbox', description: 'Styling, layout, responsive design', order: 2, duration: 3000 },
    { subjectId: subject_cntt_5.id, name: 'JavaScript ES6+', description: 'Variables, functions, DOM manipulation', order: 3, duration: 3600 },
    { subjectId: subject_cntt_5.id, name: 'React.js cơ bản', description: 'Components, props, state, hooks', order: 4, duration: 4200 },
    
    // Backend
    { subjectId: subject_cntt_6.id, name: 'Node.js fundamentals', description: 'Runtime, modules, npm, event loop', order: 1, duration: 2700 },
    { subjectId: subject_cntt_6.id, name: 'Express.js', description: 'Routing, middleware, error handling', order: 2, duration: 3000 },
    { subjectId: subject_cntt_6.id, name: 'RESTful API Design', description: 'HTTP methods, status codes, best practices', order: 3, duration: 3300 },
    { subjectId: subject_cntt_6.id, name: 'Authentication với JWT', description: 'JSON Web Token, login, protected routes', order: 4, duration: 3600 },
    
    // React Native
    { subjectId: subject_cntt_7.id, name: 'React Native Setup', description: 'Expo, CLI, project structure', order: 1, duration: 2400 },
    { subjectId: subject_cntt_7.id, name: 'UI Components', description: 'View, Text, Image, ScrollView, FlatList', order: 2, duration: 3000 },
    { subjectId: subject_cntt_7.id, name: 'Navigation', description: 'React Navigation, Stack, Tab, Drawer', order: 3, duration: 3300 },
  ];

  for (const lesson of cnttLessons) {
    const created = await prisma.lesson.create({
      data: {
        ...lesson,
        videoUrl: videoUrls[lessonCount % videoUrls.length],
        isActive: true
      }
    });
    allLessons.push(created);
    lessonCount++;
  }

  // Create lessons for other subjects (4 lessons each)
  const otherSubjects = [
    subject_ktpm_1, subject_ktpm_2, subject_ktpm_3, subject_ktpm_4,
    subject_ds_1, subject_ds_2, subject_ds_3, subject_ds_4, subject_ds_5,
    subject_anm_1, subject_anm_2, subject_anm_3, subject_anm_4,
    subject_design_1, subject_design_2, subject_design_3, subject_design_4,
    subject_mkt_1, subject_mkt_2, subject_mkt_3, subject_mkt_4
  ];

  const lessonTemplates = [
    'Giới thiệu và tổng quan',
    'Khái niệm cơ bản',
    'Thực hành cơ bản',
    'Nâng cao và ứng dụng'
  ];

  for (const subject of otherSubjects) {
    for (let i = 0; i < lessonTemplates.length; i++) {
      const lesson = await prisma.lesson.create({
        data: {
          subjectId: subject.id,
          name: `${lessonTemplates[i]}`,
          description: `Bài học ${i + 1} của môn học`,
          videoUrl: videoUrls[lessonCount % videoUrls.length],
          duration: 1800 + Math.floor(Math.random() * 2400),
          order: i + 1,
          isActive: true
        }
      });
      allLessons.push(lesson);
      lessonCount++;
    }
  }

  console.log(`✓ Created ${lessonCount} lessons`);

  // ============================================
  // 7. Create Exams for subjects
  // ============================================
  console.log('\n📝 Creating exams...');
  
  let examCount = 0;
  const allExams = [];

  for (const subject of allSubjects) {
    // Create 1-2 exams per subject
    const numExams = Math.random() > 0.5 ? 2 : 1;
    
    for (let i = 0; i < numExams; i++) {
      const exam = await prisma.exam.create({
        data: {
          subjectId: subject.id,
          name: i === 0 ? 'Kiểm tra giữa kỳ' : 'Kiểm tra cuối kỳ',
          description: i === 0 ? 'Kiểm tra kiến thức cơ bản' : 'Kiểm tra tổng hợp kiến thức',
          duration: i === 0 ? 30 : 60,
          passingScore: i === 0 ? 60 : 70,
          order: i + 1,
          isRequired: i === 1, // Cuối kỳ là bắt buộc
          isActive: true
        }
      });
      allExams.push(exam);
      examCount++;

      // Add 5-10 questions per exam
      const numQuestions = 5 + Math.floor(Math.random() * 6);
      for (let q = 0; q < numQuestions; q++) {
        const correctAnswerIndex = Math.floor(Math.random() * 4);
        await prisma.examQuestion.create({
          data: {
            examId: exam.id,
            question: `Câu hỏi ${q + 1}: Nội dung câu hỏi về kiến thức môn học?`,
            type: 'MULTIPLE_CHOICE',
            options: JSON.stringify([
              'Đáp án A - Đây là một lựa chọn',
              'Đáp án B - Đây là một lựa chọn khác',
              'Đáp án C - Đây cũng là một lựa chọn',
              'Đáp án D - Và đây là lựa chọn cuối'
            ]),
            correctAnswer: String(correctAnswerIndex),
            points: 10,
            order: q + 1
          }
        });
      }
    }
  }

  console.log(`✓ Created ${examCount} exams with questions`);

  // ============================================
  // 8. Create Enrollments (sinh viên vào các major)
  // ============================================
  console.log('\n📋 Creating enrollments...');
  
  let enrollmentCount = 0;

  // Phân bổ sinh viên: chủ yếu vào CNTT và Kỹ thuật phần mềm (teacher 1 và 2)
  // 20 sinh viên → CNTT (major 0)
  // 10 sinh viên → Kỹ thuật phần mềm (major 1)
  // 5 sinh viên → Khoa học dữ liệu (major 2)
  // 2-5 sinh viên mỗi major còn lại

  for (let i = 0; i < 20; i++) {
    await prisma.enrollment.create({
      data: {
        userId: students[i].id,
        majorId: majors[0].id, // CNTT
        status: 'ACTIVE'
      }
    });
    enrollmentCount++;
  }

  for (let i = 5; i < 15; i++) {
    await prisma.enrollment.create({
      data: {
        userId: students[i].id,
        majorId: majors[1].id, // Kỹ thuật phần mềm
        status: 'ACTIVE'
      }
    });
    enrollmentCount++;
  }

  for (let i = 15; i < 20; i++) {
    await prisma.enrollment.create({
      data: {
        userId: students[i].id,
        majorId: majors[2].id, // Khoa học dữ liệu
        status: 'ACTIVE'
      }
    });
    enrollmentCount++;
  }

  // Các major còn lại
  for (let i = 20; i < 25; i++) {
    await prisma.enrollment.create({
      data: {
        userId: students[i].id,
        majorId: majors[3].id, // An ninh mạng
        status: 'ACTIVE'
      }
    });
    enrollmentCount++;
  }

  for (let i = 25; i < 30; i++) {
    await prisma.enrollment.create({
      data: {
        userId: students[i].id,
        majorId: majors[4].id, // Thiết kế
        status: 'ACTIVE'
      }
    });
    enrollmentCount++;
  }

  for (let i = 30; i < 37; i++) {
    await prisma.enrollment.create({
      data: {
        userId: students[i].id,
        majorId: majors[5].id, // Marketing số
        status: 'ACTIVE'
      }
    });
    enrollmentCount++;
  }

  console.log(`✓ Created ${enrollmentCount} enrollments`);

  // ============================================
  // 9. Create Lesson Progress (demo data with varied dates)
  // ============================================
  console.log('\n📊 Creating lesson progress with varied dates...');
  
  let progressCount = 0;

  // Get lessons from CNTT and KTPM majors for progress (teacher 1 & 2)
  const teacher1Lessons = allLessons.filter(l => 
    [subject_cntt_1.id, subject_cntt_2.id, subject_cntt_3.id, subject_cntt_7.id,
     subject_ktpm_1.id, subject_ktpm_4.id, subject_anm_1.id].includes(l.subjectId)
  );

  const teacher1And2Lessons = allLessons.filter(l => 
    [subject_cntt_1.id, subject_cntt_2.id, subject_cntt_3.id, subject_cntt_4.id, subject_cntt_5.id, subject_cntt_6.id, subject_cntt_7.id,
     subject_ktpm_1.id, subject_ktpm_2.id, subject_ktpm_3.id, subject_ktpm_4.id].includes(l.subjectId)
  );

  // ⭐ SPECIAL: Create rich data for STUDENT 1 (students[0]) with TEACHER 1
  console.log('\n  📌 Creating detailed progress for Student 1 (test account)...');
  const student1 = students[0];
  
  // Student 1 completes 15 lessons from Teacher 1's subjects spread across 3 months
  const student1LessonsToComplete = teacher1Lessons.slice(0, 15);
  
  for (let j = 0; j < student1LessonsToComplete.length; j++) {
    const lesson = student1LessonsToComplete[j];
    
    // Spread lessons across last 90 days, with more recent activity
    let daysAgo;
    if (j < 5) {
      daysAgo = 60 + Math.floor(Math.random() * 30); // 60-90 days ago (month 1)
    } else if (j < 10) {
      daysAgo = 30 + Math.floor(Math.random() * 30); // 30-60 days ago (month 2) 
    } else {
      daysAgo = Math.floor(Math.random() * 30); // 0-30 days ago (month 3 - current)
    }
    
    const completedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const isCompleted = j < 12; // First 12 are completed, last 3 in progress
    
    // WatchTime realistic: completed lessons = duration + 10-50%, in progress = 30-70%
    const lessonDuration = lesson.duration || 1800;
    const watchTime = isCompleted 
      ? lessonDuration + Math.floor(lessonDuration * (0.1 + Math.random() * 0.4))
      : Math.floor(lessonDuration * (0.3 + Math.random() * 0.4));
    
    await prisma.lessonProgress.create({
      data: {
        userId: student1.id,
        lessonId: lesson.id,
        watchTime: watchTime,
        completed: isCompleted,
        completedAt: isCompleted ? completedDate : null,
        faceVerifiedBefore: true,
        faceVerifiedAfter: isCompleted,
        createdAt: completedDate,
        updatedAt: completedDate
      }
    });
    progressCount++;
  }
  console.log(`    ✓ Student 1: ${student1LessonsToComplete.length} lesson progress records`);

  // Create progress for other students (2-25) with varied data
  for (let i = 1; i < 25; i++) {
    const student = students[i];
    const completedLessons = 3 + Math.floor(Math.random() * 10); // 3-12 lessons
    const studentLessons = teacher1And2Lessons.slice(0, Math.min(completedLessons + 2, teacher1And2Lessons.length));
    
    for (let j = 0; j < studentLessons.length; j++) {
      const lesson = studentLessons[j];
      const isCompleted = j < completedLessons;
      
      // Random date within last 60 days
      const daysAgo = Math.floor(Math.random() * 60);
      const activityDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Realistic watchTime
      const lessonDuration = lesson.duration || 1800;
      const watchTime = isCompleted 
        ? lessonDuration + Math.floor(lessonDuration * Math.random() * 0.3)
        : Math.floor(lessonDuration * (0.2 + Math.random() * 0.5));
      
      await prisma.lessonProgress.create({
        data: {
          userId: student.id,
          lessonId: lesson.id,
          watchTime: watchTime,
          completed: isCompleted,
          completedAt: isCompleted ? activityDate : null,
          faceVerifiedBefore: true,
          faceVerifiedAfter: isCompleted,
          createdAt: activityDate,
          updatedAt: activityDate
        }
      });
      progressCount++;
    }
  }

  console.log(`✓ Created ${progressCount} lesson progress records`);

  // ============================================
  // 10. Create Exam Attempts (demo data with detailed answers)
  // ============================================
  console.log('\n🎯 Creating exam attempts with detailed answers...');
  
  let attemptCount = 0;

  // Get exams from Teacher 1's subjects specifically
  const teacher1Exams = allExams.filter(e => 
    [subject_cntt_1.id, subject_cntt_2.id, subject_cntt_3.id, subject_cntt_7.id,
     subject_ktpm_1.id, subject_ktpm_4.id, subject_anm_1.id].includes(e.subjectId)
  );

  // Get exams from CNTT & KTPM subjects (teacher 1 & 2)
  const teacher1And2Exams = allExams.filter(e => 
    [subject_cntt_1.id, subject_cntt_2.id, subject_cntt_3.id, subject_cntt_4.id, subject_cntt_5.id,
     subject_ktpm_1.id, subject_ktpm_2.id].includes(e.subjectId)
  );

  // ⭐ SPECIAL: Create detailed exam data for STUDENT 1 with Teacher 1's exams
  console.log('\n  📌 Creating detailed exam attempts for Student 1...');
  const student1ExamsToTake = teacher1Exams.slice(0, 5); // 5 exams
  
  for (let j = 0; j < student1ExamsToTake.length; j++) {
    const exam = student1ExamsToTake[j];
    
    // Get questions for this exam
    const examQuestions = await prisma.examQuestion.findMany({
      where: { examId: exam.id }
    });

    // Generate realistic answers - student 1 does well (65-85% correct)
    const answers = {};
    let correctCount = 0;
    const targetCorrectRate = 0.65 + Math.random() * 0.20; // 65-85% accuracy

    for (const question of examQuestions) {
      let userAnswer = '';
      const isCorrect = Math.random() < targetCorrectRate;

      if (question.type === 'MULTIPLE_CHOICE') {
        if (isCorrect) {
          userAnswer = question.correctAnswer;
          correctCount++;
        } else {
          // Pick wrong answer index (0-3 except correct)
          const correctIdx = parseInt(question.correctAnswer);
          let wrongIdx = Math.floor(Math.random() * 4);
          while (wrongIdx === correctIdx) wrongIdx = (wrongIdx + 1) % 4;
          userAnswer = String(wrongIdx);
        }
      } else if (question.type === 'TRUE_FALSE') {
        if (isCorrect) {
          userAnswer = question.correctAnswer;
          correctCount++;
        } else {
          userAnswer = question.correctAnswer === 'true' ? 'false' : 'true';
        }
      } else {
        // ESSAY - give partial credit
        isCorrect && correctCount++;
        userAnswer = 'Câu trả lời chi tiết của sinh viên về nội dung bài học...';
      }

      answers[question.id] = userAnswer;
    }

    const totalQuestions = examQuestions.length || 1;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= exam.passingScore;

    // Spread exams across 3 months, matching lesson progress timeline
    let daysAgo;
    if (j < 2) daysAgo = 50 + Math.floor(Math.random() * 30); // Month 1
    else if (j < 4) daysAgo = 20 + Math.floor(Math.random() * 25); // Month 2
    else daysAgo = Math.floor(Math.random() * 15); // Current month
    
    const startTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const examDuration = exam.duration || 30;
    const timeTaken = 10 + Math.random() * (examDuration - 5); // 10 mins to almost full time
    const submitTime = new Date(startTime.getTime() + timeTaken * 60 * 1000);
    
    await prisma.examAttempt.create({
      data: {
        userId: students[0].id,
        examId: exam.id,
        answers: JSON.stringify(answers),
        score,
        passed,
        status: 'GRADED',
        faceVerifiedStart: true,
        startedAt: startTime,
        submittedAt: submitTime
      }
    });
    attemptCount++;
  }
  console.log(`    ✓ Student 1: ${student1ExamsToTake.length} exam attempts`);

  // Create attempts for other students (2-20) with DETAILED ANSWERS
  for (let i = 1; i < 20; i++) {
    const student = students[i];
    const numAttempts = 1 + Math.floor(Math.random() * 3); // 1-3 attempts
    
    for (let j = 0; j < Math.min(numAttempts, teacher1And2Exams.length); j++) {
      const exam = teacher1And2Exams[j];
      
      // Get questions for this exam
      const examQuestions = await prisma.examQuestion.findMany({
        where: { examId: exam.id }
      });

      // Generate detailed answers for each question
      const answers = {};
      let correctCount = 0;

      for (const question of examQuestions) {
        let userAnswer = '';
        let isCorrect = false;

        if (question.type === 'MULTIPLE_CHOICE') {
          // 50-65% chance of correct answer
          isCorrect = Math.random() < (0.5 + Math.random() * 0.15);
          
          if (isCorrect) {
            userAnswer = question.correctAnswer;
          } else {
            const correctIdx = parseInt(question.correctAnswer);
            let wrongIdx = Math.floor(Math.random() * 4);
            while (wrongIdx === correctIdx) wrongIdx = (wrongIdx + 1) % 4;
            userAnswer = String(wrongIdx);
          }
        } else if (question.type === 'TRUE_FALSE') {
          isCorrect = Math.random() < 0.55;
          userAnswer = isCorrect ? question.correctAnswer : (question.correctAnswer === 'true' ? 'false' : 'true');
        } else {
          // ESSAY
          isCorrect = Math.random() < 0.5;
          userAnswer = 'Câu trả lời của học viên...';
        }

        answers[question.id] = userAnswer;
        if (isCorrect) correctCount++;
      }

      const totalQuestions = examQuestions.length || 1;
      const score = Math.round((correctCount / totalQuestions) * 100);
      const passed = score >= exam.passingScore;

      // Random date within last 45 days
      const daysAgo = Math.floor(Math.random() * 45);
      const startTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const submitTime = new Date(startTime.getTime() + (15 + Math.random() * 45) * 60 * 1000);
      
      await prisma.examAttempt.create({
        data: {
          userId: student.id,
          examId: exam.id,
          answers: JSON.stringify(answers),
          score,
          passed,
          status: 'GRADED',
          faceVerifiedStart: true,
          startedAt: startTime,
          submittedAt: submitTime
        }
      });
      attemptCount++;
    }
  }

  console.log(`✓ Created ${attemptCount} exam attempts with detailed answers`);

  // ============================================
  // 11. Create Blog Posts (demo)
  // ============================================
  console.log('\n📰 Creating blog posts...');
  
  const blogPostsData = [
    {
      title: 'Hướng dẫn bắt đầu học lập trình từ con số 0',
      content: 'Bài viết chia sẻ kinh nghiệm và lộ trình học lập trình cho người mới bắt đầu. Từ việc chọn ngôn ngữ đầu tiên đến cách xây dựng dự án thực tế. Lập trình không khó như bạn nghĩ, quan trọng là sự kiên trì và phương pháp học đúng.',
      userId: teachers[0].id,
      published: true,
      views: 125
    },
    {
      title: '5 sai lầm phổ biến khi học Frontend',
      content: 'Những sai lầm mà hầu hết người học Frontend hay mắc phải và cách khắc phục để tiến bộ nhanh hơn. 1. Chỉ học framework mà bỏ qua JavaScript cơ bản. 2. Không thực hành đủ. 3. Copy paste code không hiểu. 4. Không học responsive design. 5. Bỏ qua performance optimization.',
      userId: teachers[1].id,
      published: true,
      views: 98
    },
    {
      title: 'Tại sao nên học Data Science năm 2025?',
      content: 'Phân tích xu hướng nghề nghiệp và cơ hội việc làm trong lĩnh vực Data Science. Với sự bùng nổ của AI và Machine Learning, Data Science đang là một trong những nghề hot nhất. Mức lương trung bình cho Data Scientist tại Việt Nam dao động từ 20-50 triệu/tháng.',
      userId: teachers[2].id,
      published: true,
      views: 156
    },
    {
      title: 'Bảo mật web: Những điều cơ bản cần biết',
      content: 'Tổng hợp kiến thức bảo mật web cơ bản dành cho developer. SQL Injection, XSS, CSRF là những lỗ hổng phổ biến nhất. Luôn validate input, escape output, sử dụng prepared statements và implement HTTPS.',
      userId: teachers[3].id,
      published: true,
      views: 87
    },
    {
      title: 'Xu hướng thiết kế UI/UX năm 2025',
      content: 'Những xu hướng thiết kế mới nhất và cách áp dụng vào dự án thực tế. Minimalism vẫn là xu hướng chủ đạo, kết hợp với Dark mode, Glassmorphism và 3D elements. User experience luôn được đặt lên hàng đầu.',
      userId: teachers[4].id,
      published: true,
      views: 142
    },
    {
      title: 'Lộ trình học Full Stack Developer',
      content: 'Hướng dẫn chi tiết cách trở thành Full Stack Developer trong 12 tháng. Tháng 1-3: HTML/CSS/JS. Tháng 4-6: React + Node.js. Tháng 7-9: Database + API. Tháng 10-12: DevOps + Projects. Kiên trì mỗi ngày 2-3 tiếng là đủ.',
      userId: teachers[0].id,
      published: true,
      views: 203
    },
    {
      title: 'Agile/Scrum trong thực tế',
      content: 'Kinh nghiệm áp dụng Agile/Scrum vào dự án thực tế từ một tech lead. Sprint planning, daily standup, retrospective không phải là hình thức. Quan trọng là team communication và flexibility. Đừng too strict với process.',
      userId: teachers[1].id,
      published: true,
      views: 76
    },
    {
      title: 'Docker và Kubernetes cho người mới bắt đầu',
      content: 'Container hóa ứng dụng với Docker giúp deployment dễ dàng và consistency across environments. Kubernetes orchestrate containers ở scale lớn. Bắt đầu với Docker Compose trước khi nhảy vào K8s.',
      userId: teachers[1].id,
      published: true,
      views: 134
    }
  ];

  const blogPosts = [];
  for (const post of blogPostsData) {
    const created = await prisma.blogPost.create({ data: post });
    blogPosts.push(created);
  }

  console.log(`✓ Created ${blogPosts.length} blog posts`);

  // ============================================
  // 12. Create Tags
  // ============================================
  console.log('\n🏷️  Creating tags...');
  
  const tagsData = [
    { name: 'JavaScript', description: 'JavaScript programming language' },
    { name: 'Python', description: 'Python programming language' },
    { name: 'React', description: 'React.js framework' },
    { name: 'Node.js', description: 'Node.js runtime' },
    { name: 'Database', description: 'Database related topics' },
    { name: 'Frontend', description: 'Frontend development' },
    { name: 'Backend', description: 'Backend development' },
    { name: 'DevOps', description: 'DevOps practices' },
    { name: 'Security', description: 'Web security' },
    { name: 'UI/UX', description: 'User interface and experience' },
    { name: 'Beginner', description: 'Beginner friendly content' },
    { name: 'Advanced', description: 'Advanced topics' }
  ];

  const tags = [];
  for (const t of tagsData) {
    const tag = await prisma.tag.create({ data: t });
    tags.push(tag);
  }

  console.log(`✓ Created ${tags.length} tags`);

  // ============================================
  // 13. Link Tags to Blog Posts
  // ============================================
  console.log('\n🔗 Linking tags to blog posts...');
  
  let blogPostTagCount = 0;

  // Blog 1: Hướng dẫn bắt đầu học lập trình - Python, Beginner
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[0].id, tagId: tags[1].id } }); // Python
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[0].id, tagId: tags[10].id } }); // Beginner
  blogPostTagCount += 2;

  // Blog 2: 5 sai lầm Frontend - JavaScript, React, Frontend
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[1].id, tagId: tags[0].id } }); // JavaScript
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[1].id, tagId: tags[2].id } }); // React
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[1].id, tagId: tags[5].id } }); // Frontend
  blogPostTagCount += 3;

  // Blog 3: Data Science - Python, Advanced
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[2].id, tagId: tags[1].id } }); // Python
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[2].id, tagId: tags[11].id } }); // Advanced
  blogPostTagCount += 2;

  // Blog 4: Bảo mật web - Security, Backend
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[3].id, tagId: tags[8].id } }); // Security
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[3].id, tagId: tags[6].id } }); // Backend
  blogPostTagCount += 2;

  // Blog 5: UI/UX - UI/UX, Frontend
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[4].id, tagId: tags[9].id } }); // UI/UX
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[4].id, tagId: tags[5].id } }); // Frontend
  blogPostTagCount += 2;

  // Blog 6: Full Stack - JavaScript, React, Node.js
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[5].id, tagId: tags[0].id } }); // JavaScript
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[5].id, tagId: tags[2].id } }); // React
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[5].id, tagId: tags[3].id } }); // Node.js
  blogPostTagCount += 3;

  // Blog 7: Agile/Scrum - Advanced
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[6].id, tagId: tags[11].id } }); // Advanced
  blogPostTagCount += 1;

  // Blog 8: Docker/Kubernetes - DevOps, Advanced
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[7].id, tagId: tags[7].id } }); // DevOps
  await prisma.blogPostTag.create({ data: { blogPostId: blogPosts[7].id, tagId: tags[11].id } }); // Advanced
  blogPostTagCount += 2;

  console.log(`✓ Created ${blogPostTagCount} blog post tags`);

  // ============================================
  // 14. Create Comments on Blog Posts
  // ============================================
  console.log('\n💬 Creating comments on blog posts...');
  
  let commentCount = 0;

  // Comments on blog 1 (Hướng dẫn lập trình)
  await prisma.comment.create({
    data: {
      postId: blogPosts[0].id,
      userId: students[0].id,
      content: 'Bài viết rất hữu ích cho người mới bắt đầu như em. Cảm ơn thầy!'
    }
  });
  await prisma.comment.create({
    data: {
      postId: blogPosts[0].id,
      userId: students[1].id,
      content: 'Em đang theo lộ trình này và thấy hiệu quả ạ. Cảm ơn thầy đã chia sẻ.'
    }
  });
  await prisma.comment.create({
    data: {
      postId: blogPosts[0].id,
      userId: students[5].id,
      content: 'Thầy có thể làm thêm video hướng dẫn chi tiết hơn được không ạ?'
    }
  });
  commentCount += 3;

  // Comments on blog 2 (Frontend)
  await prisma.comment.create({
    data: {
      postId: blogPosts[1].id,
      userId: students[2].id,
      content: 'Em đã mắc sai lầm số 1 rồi 😅 Giờ em sẽ học lại JavaScript cơ bản.'
    }
  });
  await prisma.comment.create({
    data: {
      postId: blogPosts[1].id,
      userId: students[3].id,
      content: 'Bài viết chính xác quá! Responsive design rất quan trọng nhưng nhiều bạn hay bỏ qua.'
    }
  });
  commentCount += 2;

  // Comments on blog 3 (Data Science)
  await prisma.comment.create({
    data: {
      postId: blogPosts[2].id,
      userId: students[15].id,
      content: 'Em đang học Data Science và thấy triển vọng nghề này rất tốt. Thanks for sharing!'
    }
  });
  await prisma.comment.create({
    data: {
      postId: blogPosts[2].id,
      userId: students[16].id,
      content: 'Thầy có thể giới thiệu thêm về roadmap học Machine Learning không ạ?'
    }
  });
  commentCount += 2;

  // Comments on blog 6 (Full Stack)
  await prisma.comment.create({
    data: {
      postId: blogPosts[5].id,
      userId: students[4].id,
      content: 'Lộ trình này rất chi tiết! Em sẽ theo đúng và báo cáo kết quả sau 12 tháng.'
    }
  });
  await prisma.comment.create({
    data: {
      postId: blogPosts[5].id,
      userId: students[6].id,
      content: 'Em nghĩ 12 tháng hơi gấp, nhưng nếu kiên trì thì được. Cảm ơn thầy!'
    }
  });
  await prisma.comment.create({
    data: {
      postId: blogPosts[5].id,
      userId: students[10].id,
      content: 'DevOps có khó không thầy? Em đang lo phần này.'
    }
  });
  commentCount += 3;

  // Comment from teacher on student question
  await prisma.comment.create({
    data: {
      postId: blogPosts[5].id,
      userId: teachers[0].id,
      content: 'DevOps không khó nếu em có nền tảng Backend tốt. Bắt đầu với Docker là được rồi!'
    }
  });
  commentCount += 1;

  console.log(`✓ Created ${commentCount} comments`);

  // ============================================
  // 15. Create Questions (Q&A System)
  // ============================================
  console.log('\n❓ Creating questions...');
  
  const questionsData = [
    {
      userId: students[0].id,
      subjectId: subject_cntt_1.id,
      lessonId: allLessons.find(l => l.subjectId === subject_cntt_1.id && l.order === 2)?.id,
      title: 'Sự khác biệt giữa list và tuple trong Python?',
      content: 'Em đang học về kiểu dữ liệu trong Python, không hiểu rõ sự khác biệt giữa list và tuple. Khi nào thì dùng list, khi nào dùng tuple ạ?',
      views: 45,
      status: 'ANSWERED'
    },
    {
      userId: students[1].id,
      subjectId: subject_cntt_2.id,
      title: 'Time complexity của Quick Sort là gì?',
      content: 'Em biết Quick Sort có average case là O(n log n) nhưng worst case là O(n²). Vậy làm sao để tránh worst case ạ?',
      views: 32,
      status: 'ANSWERED'
    },
    {
      userId: students[2].id,
      subjectId: subject_cntt_3.id,
      title: 'Abstract class vs Interface - khi nào dùng cái nào?',
      content: 'Em thấy abstract class và interface khá giống nhau. Cho em hỏi trong thực tế thì dùng cái nào khi nào ạ?',
      views: 58,
      status: 'ANSWERED'
    },
    {
      userId: students[3].id,
      subjectId: subject_cntt_4.id,
      lessonId: allLessons.find(l => l.subjectId === subject_cntt_4.id && l.order === 3)?.id,
      title: 'LEFT JOIN vs INNER JOIN khác nhau như thế nào?',
      content: 'Em hay bị nhầm lẫn giữa LEFT JOIN và INNER JOIN. Thầy có thể giải thích bằng ví dụ được không ạ?',
      views: 67,
      status: 'ANSWERED'
    },
    {
      userId: students[4].id,
      subjectId: subject_cntt_5.id,
      title: 'React hooks: useEffect cleanup function hoạt động ra sao?',
      content: 'Em không hiểu rõ cleanup function trong useEffect. Khi nào thì cần return cleanup function ạ?',
      views: 89,
      status: 'ANSWERED'
    },
    {
      userId: students[5].id,
      subjectId: subject_cntt_6.id,
      title: 'JWT token nên lưu ở đâu? localStorage hay cookie?',
      content: 'Em đang implement authentication với JWT. Mọi người nói localStorage không an toàn, vậy nên lưu ở đâu ạ?',
      views: 123,
      status: 'ANSWERED'
    },
    {
      userId: students[6].id,
      subjectId: subject_ktpm_1.id,
      title: 'Scrum Sprint Planning nên làm như thế nào?',
      content: 'Team em mới áp dụng Scrum, Sprint Planning Meeting thường kéo dài 3-4 tiếng. Có cách nào tối ưu không ạ?',
      views: 41,
      status: 'ANSWERED'
    },
    {
      userId: students[7].id,
      subjectId: subject_ktpm_2.id,
      title: 'Unit test có thực sự cần thiết không?',
      content: 'Em thấy viết unit test tốn thời gian mà dự án lại gấp. Có thể skip unit test được không ạ?',
      views: 76,
      status: 'ANSWERED'
    },
    {
      userId: students[8].id,
      subjectId: subject_cntt_1.id,
      title: 'Làm sao để debug code hiệu quả?',
      content: 'Em hay gặp bug nhưng không biết debug thế nào cho đúng. Mọi người có tips gì không ạ?',
      views: 92,
      status: 'OPEN'
    },
    {
      userId: students[9].id,
      subjectId: subject_cntt_5.id,
      title: 'CSS Flexbox vs Grid - nên dùng cái nào?',
      content: 'Em thấy cả Flexbox và Grid đều dùng cho layout. Vậy khi nào dùng Flexbox, khi nào dùng Grid ạ?',
      views: 54,
      status: 'OPEN'
    }
  ];

  const questions = [];
  for (const q of questionsData) {
    const question = await prisma.question.create({ data: q });
    questions.push(question);
  }

  console.log(`✓ Created ${questions.length} questions`);

  // ============================================
  // 16. Link Tags to Questions
  // ============================================
  console.log('\n🔗 Linking tags to questions...');
  
  let questionTagCount = 0;

  // Q1: Python list/tuple - Python, Beginner
  await prisma.questionTag.create({ data: { questionId: questions[0].id, tagId: tags[1].id } });
  await prisma.questionTag.create({ data: { questionId: questions[0].id, tagId: tags[10].id } });
  questionTagCount += 2;

  // Q2: Quick Sort - Python, Advanced
  await prisma.questionTag.create({ data: { questionId: questions[1].id, tagId: tags[1].id } });
  await prisma.questionTag.create({ data: { questionId: questions[1].id, tagId: tags[11].id } });
  questionTagCount += 2;

  // Q3: Abstract class - Python, Advanced
  await prisma.questionTag.create({ data: { questionId: questions[2].id, tagId: tags[1].id } });
  await prisma.questionTag.create({ data: { questionId: questions[2].id, tagId: tags[11].id } });
  questionTagCount += 2;

  // Q4: SQL JOIN - Database
  await prisma.questionTag.create({ data: { questionId: questions[3].id, tagId: tags[4].id } });
  questionTagCount += 1;

  // Q5: React hooks - React, JavaScript
  await prisma.questionTag.create({ data: { questionId: questions[4].id, tagId: tags[2].id } });
  await prisma.questionTag.create({ data: { questionId: questions[4].id, tagId: tags[0].id } });
  questionTagCount += 2;

  // Q6: JWT - Backend, Security
  await prisma.questionTag.create({ data: { questionId: questions[5].id, tagId: tags[6].id } });
  await prisma.questionTag.create({ data: { questionId: questions[5].id, tagId: tags[8].id } });
  questionTagCount += 2;

  // Q7: Scrum - Advanced
  await prisma.questionTag.create({ data: { questionId: questions[6].id, tagId: tags[11].id } });
  questionTagCount += 1;

  // Q8: Unit test - Backend
  await prisma.questionTag.create({ data: { questionId: questions[7].id, tagId: tags[6].id } });
  questionTagCount += 1;

  // Q9: Debug - Beginner
  await prisma.questionTag.create({ data: { questionId: questions[8].id, tagId: tags[10].id } });
  questionTagCount += 1;

  // Q10: CSS Flexbox/Grid - Frontend
  await prisma.questionTag.create({ data: { questionId: questions[9].id, tagId: tags[5].id } });
  questionTagCount += 1;

  console.log(`✓ Created ${questionTagCount} question tags`);

  // ============================================
  // 17. Create Answers for Questions
  // ============================================
  console.log('\n💡 Creating answers...');
  
  let answerCount = 0;

  // Answers for Q1 (Python list/tuple)
  await prisma.answer.create({
    data: {
      questionId: questions[0].id,
      userId: teachers[0].id,
      content: 'List là mutable (có thể thay đổi) còn tuple là immutable (không thể thay đổi). List dùng [] còn tuple dùng (). Dùng tuple khi bạn muốn data không bị thay đổi, ví dụ: tọa độ (x, y), config settings. Dùng list khi cần thay đổi data thường xuyên.',
      isAccepted: true
    }
  });
  answerCount++;

  await prisma.answer.create({
    data: {
      questionId: questions[0].id,
      userId: students[10].id,
      content: 'Thêm một điểm nữa là tuple nhanh hơn list một chút vì immutable.'
    }
  });
  answerCount++;

  // Answers for Q2 (Quick Sort)
  await prisma.answer.create({
    data: {
      questionId: questions[1].id,
      userId: teachers[0].id,
      content: 'Để tránh worst case O(n²), bạn có thể: 1) Chọn pivot random thay vì luôn chọn phần tử đầu/cuối. 2) Dùng "median of three" - chọn pivot là median của first, middle, last. 3) Dùng Randomized Quick Sort. Hoặc đơn giản là dùng built-in sort() đã được optimize rất tốt rồi!',
      isAccepted: true
    }
  });
  answerCount++;

  // Answers for Q3 (Abstract class vs Interface)
  await prisma.answer.create({
    data: {
      questionId: questions[2].id,
      userId: teachers[0].id,
      content: 'Abstract class: Dùng khi có shared code giữa các subclasses. Có thể có concrete methods. Interface: Dùng khi muốn define contract mà nhiều classes không liên quan có thể implement. Ví dụ: Shape là abstract class (có shared code tính area), còn Drawable là interface (nhiều thứ có thể draw được).',
      isAccepted: true
    }
  });
  answerCount++;

  await prisma.answer.create({
    data: {
      questionId: questions[2].id,
      userId: students[11].id,
      content: 'Một class chỉ extend 1 abstract class nhưng có thể implement nhiều interfaces. Đây cũng là điểm khác biệt quan trọng.'
    }
  });
  answerCount++;

  // Answers for Q4 (SQL JOIN)
  await prisma.answer.create({
    data: {
      questionId: questions[3].id,
      userId: teachers[1].id,
      content: 'INNER JOIN: Chỉ lấy records có match ở cả 2 tables. LEFT JOIN: Lấy tất cả records từ left table, records từ right table nếu match (nếu không match thì NULL). Ví dụ: Students LEFT JOIN Enrollments sẽ show tất cả students, kể cả students chưa enroll môn nào (enrollment = NULL).',
      isAccepted: true
    }
  });
  answerCount++;

  // Answers for Q5 (React useEffect cleanup)
  await prisma.answer.create({
    data: {
      questionId: questions[4].id,
      userId: teachers[1].id,
      content: 'Cleanup function chạy khi: 1) Component unmount, 2) Trước khi effect chạy lại (nếu dependencies thay đổi). Cần cleanup khi: - Subscribe/Unsubscribe events, - setTimeout/setInterval, - WebSocket connections, - Cancel API requests. Ví dụ: useEffect(() => { const timer = setTimeout(...); return () => clearTimeout(timer); }, []);',
      isAccepted: true
    }
  });
  answerCount++;

  await prisma.answer.create({
    data: {
      questionId: questions[4].id,
      userId: students[12].id,
      content: 'Nếu không cleanup setInterval thì nó sẽ chạy mãi kể cả khi component đã unmount, gây memory leak đấy!'
    }
  });
  answerCount++;

  // Answers for Q6 (JWT storage)
  await prisma.answer.create({
    data: {
      questionId: questions[5].id,
      userId: teachers[1].id,
      content: 'Tốt nhất là dùng httpOnly cookie để tránh XSS attacks. LocalStorage có thể bị đọc bằng JavaScript nên không an toàn nếu có XSS. HttpOnly cookie không thể access từ JavaScript, chỉ server mới đọc được. Nhớ set Secure và SameSite flags nữa nhé!',
      isAccepted: true
    }
  });
  answerCount++;

  await prisma.answer.create({
    data: {
      questionId: questions[5].id,
      userId: teachers[3].id,
      content: 'Bổ sung thêm: Nếu dùng cookie thì cần implement CSRF protection. Trade-off là localStorage dễ implement hơn nhưng kém bảo mật hơn.'
    }
  });
  answerCount++;

  // Answers for Q7 (Sprint Planning)
  await prisma.answer.create({
    data: {
      questionId: questions[6].id,
      userId: teachers[0].id,
      content: 'Sprint Planning không nên quá 2 tiếng cho 2-week sprint. Tips: 1) Product Owner chuẩn bị backlog trước, 2) Team đã review user stories trước meeting, 3) Chỉ estimate high-level, chi tiết để daily standup, 4) Time-box mỗi story discussion. Nếu quá 2h thì có vấn đề về preparation!',
      isAccepted: true
    }
  });
  answerCount++;

  // Answers for Q8 (Unit test)
  await prisma.answer.create({
    data: {
      questionId: questions[7].id,
      userId: teachers[1].id,
      content: 'Unit test RẤT cần thiết! Không phải mất thời gian mà là TIẾT KIỆM thời gian sau này. Khi code base lớn, không có test thì refactor = ác mộng. Bug phát hiện sớm rẻ hơn 100 lần so với bug ở production. TDD giúp design tốt hơn. Short-term có vẻ chậm, long-term team nhanh hơn nhiều!',
      isAccepted: true
    }
  });
  answerCount++;

  await prisma.answer.create({
    data: {
      questionId: questions[7].id,
      userId: students[13].id,
      content: 'Team em dùng TDD và em thấy rất hiệu quả. Ban đầu hơi khó quen nhưng sau đó code quality tăng rõ rệt.'
    }
  });
  answerCount++;

  console.log(`✓ Created ${answerCount} answers`);

  // ============================================
  // Summary
  // ============================================
  console.log('\n✅ Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log('  - 1 Admin (admin@learnhub.com / admin123)');
  console.log('  - 5 Teachers (teacher1-5@example.com / teacher123)');
  console.log('  - 40 Students (student1-40@example.com / 123456)');
  console.log('  - 6 Majors');
  console.log(`  - ${allSubjects.length} Subjects`);
  console.log(`  - ${lessonCount} Lessons`);
  console.log(`  - ${examCount} Exams with questions`);
  console.log(`  - ${enrollmentCount} Enrollments`);
  console.log(`  - ${progressCount} Lesson progress records`);
  console.log(`  - ${attemptCount} Exam attempts`);
  console.log(`  - ${blogPosts.length} Blog posts`);
  console.log(`  - ${tags.length} Tags`);
  console.log(`  - ${commentCount} Comments`);
  console.log(`  - ${questions.length} Questions`);
  console.log(`  - ${answerCount} Answers`);
  
  console.log('\n⭐ TESTING ACCOUNTS:');
  console.log('  ┌─────────────────────────────────────────────────────────────┐');
  console.log('  │ STUDENT 1 (student1@example.com / 123456)                   │');
  console.log('  │   → Enrolled in: CNTT (Teacher 1)                           │');
  console.log('  │   → 15 lesson progress records (12 completed, 3 in progress)│');
  console.log('  │   → 5 exam attempts with 65-85% scores                      │');
  console.log('  │   → Data spread across 3 months for analytics testing       │');
  console.log('  ├─────────────────────────────────────────────────────────────┤');
  console.log('  │ TEACHER 1 (teacher1@example.com / teacher123)               │');
  console.log('  │   → Teaches: CNTT (4 môn), Kỹ thuật PM (2 môn), ANM (1 môn) │');
  console.log('  │   → Has 20+ students including Student 1                    │');
  console.log('  │   → Can view Student 1 analytics in teacher dashboard       │');
  console.log('  └─────────────────────────────────────────────────────────────┘');
  
  console.log('\n👨‍🏫 Teacher assignments:');
  console.log('  - Teacher 1: 8 subjects (focus for testing)');
  console.log('  - Teacher 2: 8 subjects');
  console.log('  - Teacher 3: 4 subjects (Khoa học dữ liệu)');
  console.log('  - Teacher 4: 3 subjects (An ninh mạng)');
  console.log('  - Teacher 5: 6 subjects (Thiết kế + Marketing)');
  
  console.log('\n👥 Student distribution:');
  console.log('  - CNTT: 20 students (Teacher 1 & 2) ⭐');
  console.log('  - Kỹ thuật PM: 10 students (Teacher 1 & 2)');
  console.log('  - Others: distributed across remaining majors');
  console.log('\n🎯 Ready for analytics testing!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



