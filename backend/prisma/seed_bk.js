const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // 1. Create Admin user
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

  // 2. Create demo users
  console.log('\n👥 Creating demo users...');
  const demoPassword = await bcrypt.hash('123456', 10);
  
  const user1 = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password: demoPassword,
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      email: 'student2@example.com',
      password: demoPassword,
      name: 'Trần Thị B',
      phone: '0907654321',
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'pending@example.com' },
    update: {},
    create: {
      email: 'pending@example.com',
      password: demoPassword,
      name: 'Lê Văn C',
      phone: '0909876543',
      role: 'USER',
      status: 'PENDING'
    }
  });

  // More users for chat testing
  const user4 = await prisma.user.upsert({
    where: { email: 'user4@example.com' },
    update: {},
    create: {
      email: 'user4@example.com',
      password: demoPassword,
      name: 'Phạm Minh D',
      phone: '0901111111',
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  const user5 = await prisma.user.upsert({
    where: { email: 'user5@example.com' },
    update: {},
    create: {
      email: 'user5@example.com',
      password: demoPassword,
      name: 'Hoàng Thu E',
      phone: '0902222222',
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  const user6 = await prisma.user.upsert({
    where: { email: 'user6@example.com' },
    update: {},
    create: {
      email: 'user6@example.com',
      password: demoPassword,
      name: 'Vũ Hải F',
      phone: '0903333333',
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  const user7 = await prisma.user.upsert({
    where: { email: 'user7@example.com' },
    update: {},
    create: {
      email: 'user7@example.com',
      password: demoPassword,
      name: 'Đỗ Lan G',
      phone: '0904444444',
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  const user8 = await prisma.user.upsert({
    where: { email: 'user8@example.com' },
    update: {},
    create: {
      email: 'user8@example.com',
      password: demoPassword,
      name: 'Bùi Quang H',
      phone: '0905555555',
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  console.log('✓ Created 8 demo users with password: 123456');

  // 2.5. Create Teacher users
  console.log('\n👨‍🏫 Creating teacher users...');
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  
  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@example.com' },
    update: {},
    create: {
      email: 'teacher1@example.com',
      password: teacherPassword,
      name: 'Nguyễn Văn Thầy',
      phone: '0911111111',
      role: 'TEACHER',
      status: 'ACTIVE'
    }
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@example.com' },
    update: {},
    create: {
      email: 'teacher2@example.com',
      password: teacherPassword,
      name: 'Trần Thị Cô',
      phone: '0922222222',
      role: 'TEACHER',
      status: 'ACTIVE'
    }
  });

  const teacher3 = await prisma.user.upsert({
    where: { email: 'teacher3@example.com' },
    update: {},
    create: {
      email: 'teacher3@example.com',
      password: teacherPassword,
      name: 'Lê Văn Giảng',
      phone: '0933333333',
      role: 'TEACHER',
      status: 'ACTIVE'
    }
  });

  const teacher4 = await prisma.user.upsert({
    where: { email: 'teacher4@example.com' },
    update: {},
    create: {
      email: 'teacher4@example.com',
      password: teacherPassword,
      name: 'Phạm Thị Dạy',
      phone: '0944444444',
      role: 'TEACHER',
      status: 'ACTIVE'
    }
  });

  const teacher5 = await prisma.user.upsert({
    where: { email: 'teacher5@example.com' },
    update: {},
    create: {
      email: 'teacher5@example.com',
      password: teacherPassword,
      name: 'Hoàng Minh Tuấn',
      phone: '0955555555',
      role: 'TEACHER',
      status: 'ACTIVE'
    }
  });

  const teacher6 = await prisma.user.upsert({
    where: { email: 'teacher6@example.com' },
    update: {},
    create: {
      email: 'teacher6@example.com',
      password: teacherPassword,
      name: 'Ngô Thị Hương',
      phone: '0966666666',
      role: 'TEACHER',
      status: 'ACTIVE'
    }
  });

  const teacher7 = await prisma.user.upsert({
    where: { email: 'teacher7@example.com' },
    update: {},
    create: {
      email: 'teacher7@example.com',
      password: teacherPassword,
      name: 'Đặng Văn Khoa',
      phone: '0977777777',
      role: 'TEACHER',
      status: 'ACTIVE'
    }
  });

  const teacher8 = await prisma.user.upsert({
    where: { email: 'teacher8@example.com' },
    update: {},
    create: {
      email: 'teacher8@example.com',
      password: teacherPassword,
      name: 'Vũ Thị Mai',
      phone: '0988888888',
      role: 'TEACHER',
      status: 'ACTIVE'
    }
  });

  console.log('✓ Created 8 teachers with password: teacher123');

  // 3. Create Majors
  console.log('\n🎓 Creating majors...');
  const major1 = await prisma.major.create({
    data: {
      name: 'Công nghệ thông tin',
      description: 'Ngành đào tạo về lập trình, phát triển phần mềm và hệ thống thông tin',
      order: 1
    }
  });

  const major2 = await prisma.major.create({
    data: {
      name: 'Toán học',
      description: 'Ngành đào tạo về toán học thuần túy và toán ứng dụng',
      order: 2
    }
  });

  const major3 = await prisma.major.create({
    data: {
      name: 'Khoa học dữ liệu',
      description: 'Ngành đào tạo về phân tích dữ liệu, machine learning và AI',
      order: 3
    }
  });

  const major4 = await prisma.major.create({
    data: {
      name: 'Thiết kế đồ họa',
      description: 'Ngành đào tạo về thiết kế UI/UX, đồ họa và sáng tạo nội dung',
      order: 4
    }
  });

  const major5 = await prisma.major.create({
    data: {
      name: 'Quản trị kinh doanh',
      description: 'Ngành đào tạo về quản lý, marketing, và chiến lược kinh doanh',
      order: 5
    }
  });

  const major6 = await prisma.major.create({
    data: {
      name: 'Kỹ thuật phần mềm',
      description: 'Ngành đào tạo về quy trình phát triển phần mềm, testing, và DevOps',
      order: 6
    }
  });

  const major7 = await prisma.major.create({
    data: {
      name: 'An ninh mạng',
      description: 'Ngành đào tạo về bảo mật hệ thống, mã hóa và phòng chống tấn công mạng',
      order: 7
    }
  });

  const major8 = await prisma.major.create({
    data: {
      name: 'Trí tuệ nhân tạo',
      description: 'Ngành đào tạo chuyên sâu về AI, Deep Learning và Computer Vision',
      order: 8
    }
  });

  const major9 = await prisma.major.create({
    data: {
      name: 'Kinh tế số',
      description: 'Ngành đào tạo về kinh tế trong thời đại số, thương mại điện tử',
      order: 9
    }
  });

  const major10 = await prisma.major.create({
    data: {
      name: 'Ngôn ngữ Anh',
      description: 'Ngành đào tạo về tiếng Anh chuyên ngành, biên phiên dịch',
      order: 10
    }
  });

  const major11 = await prisma.major.create({
    data: {
      name: 'Marketing số',
      description: 'Ngành đào tạo về Digital Marketing, SEO, Social Media Marketing',
      order: 11
    }
  });

  const major12 = await prisma.major.create({
    data: {
      name: 'Kế toán - Tài chính',
      description: 'Ngành đào tạo về kế toán doanh nghiệp, tài chính và đầu tư',
      order: 12
    }
  });

  console.log('✓ Created 12 majors');

  // 4. Create Subjects
  console.log('\n📚 Creating subjects...');
  
  // IT subjects
  const subject1 = await prisma.subject.create({
    data: {
      majorId: major1.id,
      teacherId: teacher1.id,
      name: 'Lập trình cơ bản',
      description: 'Học các khái niệm cơ bản về lập trình, biến, hàm, vòng lặp',
      order: 1
    }
  });

  const subject2 = await prisma.subject.create({
    data: {
      majorId: major1.id,
      teacherId: teacher1.id,
      name: 'Cấu trúc dữ liệu và giải thuật',
      description: 'Học về mảng, linked list, stack, queue, tree và các thuật toán tìm kiếm, sắp xếp',
      prerequisiteId: subject1.id,
      order: 2
    }
  });

  const subject3 = await prisma.subject.create({
    data: {
      majorId: major1.id,
      teacherId: teacher2.id,
      name: 'Lập trình hướng đối tượng',
      description: 'Tìm hiểu về OOP: class, object, inheritance, polymorphism',
      prerequisiteId: subject1.id,
      order: 3
    }
  });

  const subject4 = await prisma.subject.create({
    data: {
      majorId: major1.id,
      teacherId: teacher2.id,
      name: 'Phát triển Web',
      description: 'HTML, CSS, JavaScript và các framework hiện đại',
      prerequisiteId: subject1.id,
      order: 4
    }
  });

  // Math subjects
  const subject5 = await prisma.subject.create({
    data: {
      majorId: major2.id,
      teacherId: teacher3.id,
      name: 'Giải tích 1',
      description: 'Học về đạo hàm, tích phân, chuỗi số',
      order: 1
    }
  });

  const subject6 = await prisma.subject.create({
    data: {
      majorId: major2.id,
      teacherId: teacher3.id,
      name: 'Đại số tuyến tính',
      description: 'Ma trận, định thức, không gian vector',
      order: 2
    }
  });

  // Data Science subjects
  const subject7 = await prisma.subject.create({
    data: {
      majorId: major3.id,
      teacherId: teacher4.id,
      name: 'Python cho Data Science',
      description: 'Học Python, NumPy, Pandas để phân tích dữ liệu',
      order: 1
    }
  });

  const subject8 = await prisma.subject.create({
    data: {
      majorId: major3.id,
      teacherId: teacher4.id,
      name: 'Machine Learning cơ bản',
      description: 'Các thuật toán ML: Linear Regression, Decision Tree, Neural Network',
      prerequisiteId: subject7.id,
      order: 2
    }
  });

  // Design subjects
  const subject9 = await prisma.subject.create({
    data: {
      majorId: major4.id,
      teacherId: teacher5.id,
      name: 'Nguyên lý thiết kế',
      description: 'Color theory, typography, layout và composition',
      order: 1
    }
  });

  const subject10 = await prisma.subject.create({
    data: {
      majorId: major4.id,
      teacherId: teacher5.id,
      name: 'UI/UX Design',
      description: 'Thiết kế giao diện người dùng và trải nghiệm người dùng',
      prerequisiteId: subject9.id,
      order: 2
    }
  });

  // Quản trị kinh doanh subjects (major5)
  const subject11 = await prisma.subject.create({
    data: {
      majorId: major5.id,
      teacherId: teacher6.id,
      name: 'Quản trị học',
      description: 'Các nguyên tắc cơ bản về quản trị và tổ chức doanh nghiệp',
      order: 1
    }
  });

  const subject12 = await prisma.subject.create({
    data: {
      majorId: major5.id,
      teacherId: teacher6.id,
      name: 'Marketing căn bản',
      description: 'Các khái niệm cơ bản về marketing, nghiên cứu thị trường',
      order: 2
    }
  });

  const subject13 = await prisma.subject.create({
    data: {
      majorId: major5.id,
      teacherId: teacher6.id,
      name: 'Quản trị nhân sự',
      description: 'Quản lý nguồn nhân lực, tuyển dụng, đào tạo và phát triển',
      prerequisiteId: subject11.id,
      order: 3
    }
  });

  // Kỹ thuật phần mềm subjects (major6)
  const subject14 = await prisma.subject.create({
    data: {
      majorId: major6.id,
      teacherId: teacher1.id,
      name: 'Quy trình phát triển phần mềm',
      description: 'Agile, Scrum, Waterfall và các phương pháp quản lý dự án',
      order: 1
    }
  });

  const subject15 = await prisma.subject.create({
    data: {
      majorId: major6.id,
      teacherId: teacher2.id,
      name: 'Kiểm thử phần mềm',
      description: 'Unit test, Integration test, E2E test và automation testing',
      prerequisiteId: subject14.id,
      order: 2
    }
  });

  const subject16 = await prisma.subject.create({
    data: {
      majorId: major6.id,
      teacherId: teacher2.id,
      name: 'DevOps và CI/CD',
      description: 'Docker, Kubernetes, Jenkins, GitHub Actions',
      prerequisiteId: subject15.id,
      order: 3
    }
  });

  // An ninh mạng subjects (major7)
  const subject17 = await prisma.subject.create({
    data: {
      majorId: major7.id,
      teacherId: teacher7.id,
      name: 'Cơ sở an ninh mạng',
      description: 'Các khái niệm cơ bản về bảo mật, mã hóa và xác thực',
      order: 1
    }
  });

  const subject18 = await prisma.subject.create({
    data: {
      majorId: major7.id,
      teacherId: teacher7.id,
      name: 'Ethical Hacking',
      description: 'Kỹ thuật penetration testing và phát hiện lỗ hổng bảo mật',
      prerequisiteId: subject17.id,
      order: 2
    }
  });

  const subject19 = await prisma.subject.create({
    data: {
      majorId: major7.id,
      teacherId: teacher7.id,
      name: 'Bảo mật ứng dụng web',
      description: 'OWASP Top 10, SQL Injection, XSS và cách phòng chống',
      prerequisiteId: subject17.id,
      order: 3
    }
  });

  // Trí tuệ nhân tạo subjects (major8)
  const subject20 = await prisma.subject.create({
    data: {
      majorId: major8.id,
      teacherId: teacher4.id,
      name: 'Deep Learning',
      description: 'Neural Networks, CNN, RNN và các kiến trúc hiện đại',
      order: 1
    }
  });

  const subject21 = await prisma.subject.create({
    data: {
      majorId: major8.id,
      teacherId: teacher4.id,
      name: 'Computer Vision',
      description: 'Xử lý ảnh, nhận dạng đối tượng, face recognition',
      prerequisiteId: subject20.id,
      order: 2
    }
  });

  const subject22 = await prisma.subject.create({
    data: {
      majorId: major8.id,
      teacherId: teacher4.id,
      name: 'Natural Language Processing',
      description: 'Xử lý ngôn ngữ tự nhiên, chatbot, sentiment analysis',
      prerequisiteId: subject20.id,
      order: 3
    }
  });

  // Kinh tế số subjects (major9)
  const subject23 = await prisma.subject.create({
    data: {
      majorId: major9.id,
      teacherId: teacher6.id,
      name: 'Kinh tế học đại cương',
      description: 'Vi mô, vĩ mô và các nguyên lý kinh tế cơ bản',
      order: 1
    }
  });

  const subject24 = await prisma.subject.create({
    data: {
      majorId: major9.id,
      teacherId: teacher6.id,
      name: 'Thương mại điện tử',
      description: 'E-commerce, thanh toán trực tuyến và logistics',
      prerequisiteId: subject23.id,
      order: 2
    }
  });

  // Ngôn ngữ Anh subjects (major10)
  const subject25 = await prisma.subject.create({
    data: {
      majorId: major10.id,
      teacherId: teacher8.id,
      name: 'Tiếng Anh giao tiếp',
      description: 'Kỹ năng nghe, nói trong giao tiếp hàng ngày',
      order: 1
    }
  });

  const subject26 = await prisma.subject.create({
    data: {
      majorId: major10.id,
      teacherId: teacher8.id,
      name: 'Tiếng Anh chuyên ngành IT',
      description: 'Thuật ngữ và kỹ năng tiếng Anh trong lĩnh vực CNTT',
      prerequisiteId: subject25.id,
      order: 2
    }
  });

  const subject27 = await prisma.subject.create({
    data: {
      majorId: major10.id,
      teacherId: teacher8.id,
      name: 'TOEIC Preparation',
      description: 'Luyện thi TOEIC từ 500-900 điểm',
      prerequisiteId: subject25.id,
      order: 3
    }
  });

  // Marketing số subjects (major11)
  const subject28 = await prisma.subject.create({
    data: {
      majorId: major11.id,
      teacherId: teacher5.id,
      name: 'Digital Marketing căn bản',
      description: 'Tổng quan về marketing số, các kênh và công cụ',
      order: 1
    }
  });

  const subject29 = await prisma.subject.create({
    data: {
      majorId: major11.id,
      teacherId: teacher5.id,
      name: 'SEO & SEM',
      description: 'Tối ưu hóa công cụ tìm kiếm và quảng cáo Google Ads',
      prerequisiteId: subject28.id,
      order: 2
    }
  });

  const subject30 = await prisma.subject.create({
    data: {
      majorId: major11.id,
      teacherId: teacher5.id,
      name: 'Social Media Marketing',
      description: 'Marketing trên Facebook, Instagram, TikTok, LinkedIn',
      prerequisiteId: subject28.id,
      order: 3
    }
  });

  const subject31 = await prisma.subject.create({
    data: {
      majorId: major11.id,
      teacherId: teacher5.id,
      name: 'Content Marketing',
      description: 'Xây dựng chiến lược nội dung, copywriting và storytelling',
      prerequisiteId: subject28.id,
      order: 4
    }
  });

  // Kế toán - Tài chính subjects (major12)
  const subject32 = await prisma.subject.create({
    data: {
      majorId: major12.id,
      teacherId: teacher6.id,
      name: 'Nguyên lý kế toán',
      description: 'Các nguyên tắc kế toán cơ bản, sổ sách và báo cáo tài chính',
      order: 1
    }
  });

  const subject33 = await prisma.subject.create({
    data: {
      majorId: major12.id,
      teacherId: teacher6.id,
      name: 'Kế toán doanh nghiệp',
      description: 'Kế toán chi phí, doanh thu và quản lý tài sản',
      prerequisiteId: subject32.id,
      order: 2
    }
  });

  const subject34 = await prisma.subject.create({
    data: {
      majorId: major12.id,
      teacherId: teacher6.id,
      name: 'Phân tích tài chính',
      description: 'Phân tích báo cáo tài chính, định giá doanh nghiệp',
      prerequisiteId: subject33.id,
      order: 3
    }
  });

  const subject35 = await prisma.subject.create({
    data: {
      majorId: major12.id,
      teacherId: teacher6.id,
      name: 'Thuế và luật kế toán',
      description: 'Các quy định về thuế, luật kế toán Việt Nam',
      prerequisiteId: subject32.id,
      order: 4
    }
  });

  console.log('✓ Created 35 subjects across 12 majors');

  // 5. Create Lessons
  console.log('\n📖 Creating lessons...');
  
  // Subject 1: Lập trình cơ bản (5 lessons)
  const lesson1_1 = await prisma.lesson.create({
    data: {
      subjectId: subject1.id,
      name: 'Giới thiệu về lập trình',
      description: 'Tổng quan về lập trình, các ngôn ngữ lập trình phổ biến',
      duration: 45,
      videoUrl: 'https://www.youtube.com/watch?v=example1',
      order: 1
    }
  });

  const lesson1_2 = await prisma.lesson.create({
    data: {
      subjectId: subject1.id,
      name: 'Biến và kiểu dữ liệu',
      description: 'Học về biến, kiểu dữ liệu nguyên thủy và tham chiếu',
      duration: 60,
      videoUrl: 'https://www.youtube.com/watch?v=example2',
      prerequisiteId: lesson1_1.id,
      order: 2
    }
  });

  const lesson1_3 = await prisma.lesson.create({
    data: {
      subjectId: subject1.id,
      name: 'Cấu trúc điều khiển',
      description: 'If-else, switch-case, toán tử logic',
      duration: 75,
      videoUrl: 'https://www.youtube.com/watch?v=example3',
      prerequisiteId: lesson1_2.id,
      order: 3
    }
  });

  const lesson1_4 = await prisma.lesson.create({
    data: {
      subjectId: subject1.id,
      name: 'Vòng lặp',
      description: 'For, while, do-while và nested loops',
      duration: 90,
      videoUrl: 'https://www.youtube.com/watch?v=example4',
      prerequisiteId: lesson1_3.id,
      order: 4
    }
  });

  const lesson1_5 = await prisma.lesson.create({
    data: {
      subjectId: subject1.id,
      name: 'Hàm và phạm vi biến',
      description: 'Định nghĩa hàm, tham số, return, scope',
      duration: 60,
      prerequisiteId: lesson1_4.id,
      order: 5
    }
  });

  // Subject 2: CTDL (4 lessons)
  const lesson2_1 = await prisma.lesson.create({
    data: {
      subjectId: subject2.id,
      name: 'Mảng (Array)',
      description: 'Cấu trúc mảng, các thao tác cơ bản',
      duration: 60,
      order: 1
    }
  });

  const lesson2_2 = await prisma.lesson.create({
    data: {
      subjectId: subject2.id,
      name: 'Danh sách liên kết (Linked List)',
      description: 'Single linked list, double linked list',
      duration: 75,
      prerequisiteId: lesson2_1.id,
      order: 2
    }
  });

  const lesson2_3 = await prisma.lesson.create({
    data: {
      subjectId: subject2.id,
      name: 'Stack và Queue',
      description: 'LIFO và FIFO, ứng dụng thực tế',
      duration: 60,
      prerequisiteId: lesson2_2.id,
      order: 3
    }
  });

  const lesson2_4 = await prisma.lesson.create({
    data: {
      subjectId: subject2.id,
      name: 'Thuật toán sắp xếp',
      description: 'Bubble sort, Quick sort, Merge sort',
      duration: 90,
      prerequisiteId: lesson2_3.id,
      order: 4
    }
  });

  // Subject 7: Python for DS (4 lessons)
  const lesson7_1 = await prisma.lesson.create({
    data: {
      subjectId: subject7.id,
      name: 'Python cơ bản',
      description: 'Syntax, data types, control flow trong Python',
      duration: 60,
      order: 1
    }
  });

  const lesson7_2 = await prisma.lesson.create({
    data: {
      subjectId: subject7.id,
      name: 'NumPy cho khoa học dữ liệu',
      description: 'Array operations, broadcasting, vectorization',
      duration: 75,
      prerequisiteId: lesson7_1.id,
      order: 2
    }
  });

  const lesson7_3 = await prisma.lesson.create({
    data: {
      subjectId: subject7.id,
      name: 'Pandas cơ bản',
      description: 'DataFrame, Series, data manipulation',
      duration: 90,
      prerequisiteId: lesson7_2.id,
      order: 3
    }
  });

  const lesson7_4 = await prisma.lesson.create({
    data: {
      subjectId: subject7.id,
      name: 'Data Visualization với Matplotlib',
      description: 'Vẽ biểu đồ, visualize data insights',
      duration: 60,
      prerequisiteId: lesson7_3.id,
      order: 4
    }
  });

  // Subject 3: OOP (3 lessons)
  const lesson3_1 = await prisma.lesson.create({
    data: {
      subjectId: subject3.id,
      name: 'Giới thiệu về OOP',
      description: 'Class, Object, 4 tính chất của OOP',
      duration: 60,
      order: 1
    }
  });

  const lesson3_2 = await prisma.lesson.create({
    data: {
      subjectId: subject3.id,
      name: 'Encapsulation và Inheritance',
      description: 'Đóng gói dữ liệu và kế thừa trong OOP',
      duration: 75,
      prerequisiteId: lesson3_1.id,
      order: 2
    }
  });

  const lesson3_3 = await prisma.lesson.create({
    data: {
      subjectId: subject3.id,
      name: 'Polymorphism và Abstraction',
      description: 'Đa hình và trừu tượng hóa',
      duration: 75,
      prerequisiteId: lesson3_2.id,
      order: 3
    }
  });

  // Subject 4: Web Dev (4 lessons)
  const lesson4_1 = await prisma.lesson.create({
    data: {
      subjectId: subject4.id,
      name: 'HTML và CSS cơ bản',
      description: 'Tạo cấu trúc web với HTML, styling với CSS',
      duration: 90,
      order: 1
    }
  });

  const lesson4_2 = await prisma.lesson.create({
    data: {
      subjectId: subject4.id,
      name: 'JavaScript cơ bản',
      description: 'DOM manipulation, Event handling',
      duration: 90,
      prerequisiteId: lesson4_1.id,
      order: 2
    }
  });

  const lesson4_3 = await prisma.lesson.create({
    data: {
      subjectId: subject4.id,
      name: 'React Framework',
      description: 'Components, Props, State, Hooks',
      duration: 120,
      prerequisiteId: lesson4_2.id,
      order: 3
    }
  });

  const lesson4_4 = await prisma.lesson.create({
    data: {
      subjectId: subject4.id,
      name: 'Backend với Node.js',
      description: 'Express.js, REST API, Database',
      duration: 120,
      prerequisiteId: lesson4_3.id,
      order: 4
    }
  });

  // Subject 5: Giải tích 1 (3 lessons)
  const lesson5_1 = await prisma.lesson.create({
    data: {
      subjectId: subject5.id,
      name: 'Giới hạn và Liên tục',
      description: 'Khái niệm giới hạn, hàm liên tục',
      duration: 90,
      order: 1
    }
  });

  const lesson5_2 = await prisma.lesson.create({
    data: {
      subjectId: subject5.id,
      name: 'Đạo hàm',
      description: 'Định nghĩa đạo hàm, quy tắc tính đạo hàm',
      duration: 90,
      prerequisiteId: lesson5_1.id,
      order: 2
    }
  });

  const lesson5_3 = await prisma.lesson.create({
    data: {
      subjectId: subject5.id,
      name: 'Tích phân',
      description: 'Tích phân bất định và xác định',
      duration: 120,
      prerequisiteId: lesson5_2.id,
      order: 3
    }
  });

  // Subject 6: Đại số tuyến tính (3 lessons)
  const lesson6_1 = await prisma.lesson.create({
    data: {
      subjectId: subject6.id,
      name: 'Ma trận cơ bản',
      description: 'Khái niệm ma trận, các phép toán ma trận',
      duration: 75,
      order: 1
    }
  });

  const lesson6_2 = await prisma.lesson.create({
    data: {
      subjectId: subject6.id,
      name: 'Định thức và Ma trận nghịch đảo',
      description: 'Tính định thức, tìm ma trận nghịch đảo',
      duration: 90,
      prerequisiteId: lesson6_1.id,
      order: 2
    }
  });

  const lesson6_3 = await prisma.lesson.create({
    data: {
      subjectId: subject6.id,
      name: 'Không gian Vector',
      description: 'Vector, cơ sở, chiều của không gian',
      duration: 90,
      prerequisiteId: lesson6_2.id,
      order: 3
    }
  });

  // Subject 8: Machine Learning (4 lessons)
  const lesson8_1 = await prisma.lesson.create({
    data: {
      subjectId: subject8.id,
      name: 'Giới thiệu Machine Learning',
      description: 'Supervised vs Unsupervised Learning',
      duration: 60,
      order: 1
    }
  });

  const lesson8_2 = await prisma.lesson.create({
    data: {
      subjectId: subject8.id,
      name: 'Linear Regression',
      description: 'Hồi quy tuyến tính, gradient descent',
      duration: 90,
      prerequisiteId: lesson8_1.id,
      order: 2
    }
  });

  const lesson8_3 = await prisma.lesson.create({
    data: {
      subjectId: subject8.id,
      name: 'Classification với Decision Tree',
      description: 'Cây quyết định, overfitting, pruning',
      duration: 90,
      prerequisiteId: lesson8_2.id,
      order: 3
    }
  });

  const lesson8_4 = await prisma.lesson.create({
    data: {
      subjectId: subject8.id,
      name: 'Neural Network cơ bản',
      description: 'Perceptron, backpropagation, activation functions',
      duration: 120,
      prerequisiteId: lesson8_3.id,
      order: 4
    }
  });

  // Subject 9: Nguyên lý thiết kế (3 lessons)
  const lesson9_1 = await prisma.lesson.create({
    data: {
      subjectId: subject9.id,
      name: 'Color Theory',
      description: 'Lý thuyết màu sắc, color wheel, harmony',
      duration: 75,
      order: 1
    }
  });

  const lesson9_2 = await prisma.lesson.create({
    data: {
      subjectId: subject9.id,
      name: 'Typography',
      description: 'Font pairing, hierarchy, readability',
      duration: 75,
      prerequisiteId: lesson9_1.id,
      order: 2
    }
  });

  const lesson9_3 = await prisma.lesson.create({
    data: {
      subjectId: subject9.id,
      name: 'Layout và Composition',
      description: 'Grid system, golden ratio, white space',
      duration: 90,
      prerequisiteId: lesson9_2.id,
      order: 3
    }
  });

  // Subject 10: UI/UX (4 lessons)
  const lesson10_1 = await prisma.lesson.create({
    data: {
      subjectId: subject10.id,
      name: 'UX Research',
      description: 'User research, persona, user journey',
      duration: 90,
      order: 1
    }
  });

  const lesson10_2 = await prisma.lesson.create({
    data: {
      subjectId: subject10.id,
      name: 'Wireframing và Prototyping',
      description: 'Sketch wireframes, interactive prototypes',
      duration: 90,
      prerequisiteId: lesson10_1.id,
      order: 2
    }
  });

  const lesson10_3 = await prisma.lesson.create({
    data: {
      subjectId: subject10.id,
      name: 'Visual Design',
      description: 'UI components, design systems, style guide',
      duration: 120,
      prerequisiteId: lesson10_2.id,
      order: 3
    }
  });

  const lesson10_4 = await prisma.lesson.create({
    data: {
      subjectId: subject10.id,
      name: 'Usability Testing',
      description: 'A/B testing, heatmap, user feedback',
      duration: 75,
      prerequisiteId: lesson10_3.id,
      order: 4
    }
  });

  console.log('✓ Created 40 lessons with chain prerequisites');

  // 6. Create Exams
  console.log('\n📝 Creating exams...');
  
  // Exam cho subject 1
  const exam1 = await prisma.exam.create({
    data: {
      subjectId: subject1.id,
      name: 'Kiểm tra giữa kỳ - Lập trình cơ bản',
      description: 'Bài kiểm tra kiến thức cơ bản về lập trình',
      duration: 60,
      passingScore: 60,
      isRequired: true,
      order: 1
    }
  });

  // Add questions to exam1
  await prisma.examQuestion.createMany({
    data: [
      {
        examId: exam1.id,
        question: 'Trong lập trình, biến là gì?',
        type: 'MULTIPLE_CHOICE',
        options: JSON.stringify(['Một vùng nhớ lưu trữ dữ liệu', 'Một hàm', 'Một vòng lặp', 'Một câu lệnh']),
        correctAnswer: 'A',
        points: 2,
        order: 1
      },
      {
        examId: exam1.id,
        question: 'Vòng lặp for được sử dụng để làm gì?',
        type: 'MULTIPLE_CHOICE',
        options: JSON.stringify(['Lặp lại code nhiều lần', 'Kiểm tra điều kiện', 'Khai báo biến', 'In ra màn hình']),
        correctAnswer: 'A',
        points: 2,
        order: 2
      },
      {
        examId: exam1.id,
        question: 'Python là ngôn ngữ biên dịch?',
        type: 'TRUE_FALSE',
        correctAnswer: 'False',
        points: 1,
        order: 3
      },
      {
        examId: exam1.id,
        question: 'Hàm return trong lập trình dùng để làm gì?',
        type: 'MULTIPLE_CHOICE',
        options: JSON.stringify(['Trả về giá trị từ hàm', 'Khai báo biến', 'Tạo vòng lặp', 'In ra console']),
        correctAnswer: 'A',
        points: 2,
        order: 4
      },
      {
        examId: exam1.id,
        question: 'Viết code in ra "Hello World" bằng Python',
        type: 'ESSAY',
        correctAnswer: 'print("Hello World")',
        points: 3,
        order: 5
      }
    ]
  });

  // Exam cuối kỳ cho subject 1
  const exam2 = await prisma.exam.create({
    data: {
      subjectId: subject1.id,
      name: 'Thi cuối kỳ - Lập trình cơ bản',
      description: 'Bài thi tổng hợp toàn bộ kiến thức môn học',
      duration: 90,
      passingScore: 70,
      isRequired: true,
      order: 2
    }
  });

  await prisma.examQuestion.createMany({
    data: [
      {
        examId: exam2.id,
        question: 'Array trong JavaScript bắt đầu từ index nào?',
        type: 'MULTIPLE_CHOICE',
        options: JSON.stringify(['0', '1', '-1', 'Tùy ý']),
        correctAnswer: 'A',
        points: 1,
        order: 1
      },
      {
        examId: exam2.id,
        question: 'Function declaration và function expression có giống nhau không?',
        type: 'TRUE_FALSE',
        correctAnswer: 'False',
        points: 1,
        order: 2
      },
      {
        examId: exam2.id,
        question: 'Giải thích khái niệm hoisting trong JavaScript',
        type: 'ESSAY',
        correctAnswer: 'Hoisting là cơ chế JavaScript đưa khai báo biến và hàm lên đầu scope',
        points: 3,
        order: 3
      }
    ]
  });

  // Exam cho subject 2
  const exam3 = await prisma.exam.create({
    data: {
      subjectId: subject2.id,
      name: 'Kiểm tra CTDL & GT',
      description: 'Bài kiểm tra về cấu trúc dữ liệu và giải thuật',
      duration: 75,
      passingScore: 65,
      isRequired: true,
      order: 1
    }
  });

  await prisma.examQuestion.createMany({
    data: [
      {
        examId: exam3.id,
        question: 'Độ phức tạp của Binary Search là?',
        type: 'MULTIPLE_CHOICE',
        options: JSON.stringify(['O(log n)', 'O(n)', 'O(n²)', 'O(1)']),
        correctAnswer: 'A',
        points: 2,
        order: 1
      },
      {
        examId: exam3.id,
        question: 'Stack hoạt động theo nguyên tắc LIFO?',
        type: 'TRUE_FALSE',
        correctAnswer: 'True',
        points: 1,
        order: 2
      },
      {
        examId: exam3.id,
        question: 'Viết thuật toán tìm phần tử lớn nhất trong mảng',
        type: 'ESSAY',
        correctAnswer: 'Duyệt qua mảng, so sánh từng phần tử với max hiện tại',
        points: 4,
        order: 3
      }
    ]
  });

  // Exam cho subject 7
  const exam4 = await prisma.exam.create({
    data: {
      subjectId: subject7.id,
      name: 'Đánh giá Python & Data Science',
      description: 'Kiểm tra kiến thức Python, NumPy, Pandas',
      duration: 60,
      passingScore: 60,
      isRequired: false,
      order: 1
    }
  });

  await prisma.examQuestion.createMany({
    data: [
      {
        examId: exam4.id,
        question: 'Pandas DataFrame là gì?',
        type: 'MULTIPLE_CHOICE',
        options: JSON.stringify(['Cấu trúc dữ liệu dạng bảng 2D', 'Một mảng 1D', 'Một dictionary', 'Một string']),
        correctAnswer: 'A',
        points: 2,
        order: 1
      },
      {
        examId: exam4.id,
        question: 'NumPy array nhanh hơn Python list?',
        type: 'TRUE_FALSE',
        correctAnswer: 'True',
        points: 1,
        order: 2
      }
    ]
  });

  console.log('✓ Created 4 exams with 15 total questions');

  // 7. Enroll users to majors
  console.log('\n🎒 Creating enrollments...');
  
  // User1 enrolled in major1 (IT)
  await prisma.enrollment.create({
    data: {
      userId: user1.id,
      majorId: major1.id,
      status: 'ACTIVE'
    }
  });

  // User1 also enrolled in major3 (Data Science)
  await prisma.enrollment.create({
    data: {
      userId: user1.id,
      majorId: major3.id,
      status: 'ACTIVE'
    }
  });

  // User2 enrolled in major2 (Math)
  await prisma.enrollment.create({
    data: {
      userId: user2.id,
      majorId: major2.id,
      status: 'ACTIVE'
    }
  });

  // User2 also enrolled in major4 (Design)
  await prisma.enrollment.create({
    data: {
      userId: user2.id,
      majorId: major4.id,
      status: 'ACTIVE'
    }
  });

  // User3 enrolled in major1 (IT) - ACTIVE status
  await prisma.enrollment.create({
    data: {
      userId: user3.id,
      majorId: major1.id,
      status: 'ACTIVE'
    }
  });

  // User4 enrolled in major1 (IT) and major6 (Software Engineering)
  await prisma.enrollment.create({
    data: {
      userId: user4.id,
      majorId: major1.id,
      status: 'ACTIVE'
    }
  });

  await prisma.enrollment.create({
    data: {
      userId: user4.id,
      majorId: major6.id,
      status: 'ACTIVE'
    }
  });

  // User5 enrolled in major3 (Data Science) and major5 (Business)
  await prisma.enrollment.create({
    data: {
      userId: user5.id,
      majorId: major3.id,
      status: 'ACTIVE'
    }
  });

  await prisma.enrollment.create({
    data: {
      userId: user5.id,
      majorId: major5.id,
      status: 'ACTIVE'
    }
  });

  // User6 enrolled in major1 (IT) and major3 (Data Science) - overlaps with user1
  await prisma.enrollment.create({
    data: {
      userId: user6.id,
      majorId: major1.id,
      status: 'ACTIVE'
    }
  });

  await prisma.enrollment.create({
    data: {
      userId: user6.id,
      majorId: major3.id,
      status: 'ACTIVE'
    }
  });

  // User7 enrolled in major4 (Design) and major5 (Business)
  await prisma.enrollment.create({
    data: {
      userId: user7.id,
      majorId: major4.id,
      status: 'ACTIVE'
    }
  });

  await prisma.enrollment.create({
    data: {
      userId: user7.id,
      majorId: major5.id,
      status: 'ACTIVE'
    }
  });

  // User8 enrolled in major2 (Math) and major6 (Software Engineering)
  await prisma.enrollment.create({
    data: {
      userId: user8.id,
      majorId: major2.id,
      status: 'ACTIVE'
    }
  });

  await prisma.enrollment.create({
    data: {
      userId: user8.id,
      majorId: major6.id,
      status: 'ACTIVE'
    }
  });

  console.log('✓ Created 15 enrollments for demo users (user1-user8 across 6 majors)');

  // 8. Create lesson progress
  console.log('\n📊 Creating lesson progress...');
  
  // User1 completed first 3 lessons of subject 1
  await prisma.lessonProgress.create({
    data: {
      userId: user1.id,
      lessonId: lesson1_1.id,
      watchTime: 45,
      completed: true,
      completedAt: new Date('2025-01-05'),
      faceVerifiedBefore: true,
      faceVerifiedAfter: true
    }
  });

  await prisma.lessonProgress.create({
    data: {
      userId: user1.id,
      lessonId: lesson1_2.id,
      watchTime: 60,
      completed: true,
      completedAt: new Date('2025-01-07'),
      faceVerifiedBefore: true,
      faceVerifiedAfter: true
    }
  });

  await prisma.lessonProgress.create({
    data: {
      userId: user1.id,
      lessonId: lesson1_3.id,
      watchTime: 50,
      completed: false, // In progress
      faceVerifiedBefore: true,
      faceVerifiedAfter: false
    }
  });

  // User1 started lesson in Data Science
  await prisma.lessonProgress.create({
    data: {
      userId: user1.id,
      lessonId: lesson7_1.id,
      watchTime: 30,
      completed: false,
      faceVerifiedBefore: true
    }
  });

  console.log('✓ Created 4 lesson progress records');

  // 9. Create blog posts
  console.log('\n📰 Creating blog posts...');
  
  const blogPost1 = await prisma.blogPost.create({
    data: {
      userId: user1.id,
      title: 'Những tips học lập trình hiệu quả cho người mới bắt đầu',
      content: `# Giới thiệu
      
Học lập trình không khó nếu bạn có phương pháp đúng. Dưới đây là những tips tôi đúc kết được:

## 1. Practice makes perfect
Hãy code mỗi ngày, dù chỉ 30 phút.

## 2. Đọc code của người khác
GitHub là kho báu vô tận để học hỏi.

## 3. Build projects
Đừng chỉ học lý thuyết, hãy làm dự án thực tế.`,
      published: true,
      views: 234,
      createdAt: new Date('2025-01-10')
    }
  });

  const blogPost2 = await prisma.blogPost.create({
    data: {
      userId: user2.id,
      title: 'Machine Learning cho người mới - Bắt đầu từ đâu?',
      content: `# Machine Learning Roadmap

## Bước 1: Nền tảng toán học
- Linear Algebra
- Statistics & Probability
- Calculus

## Bước 2: Python & Libraries
- NumPy, Pandas
- Scikit-learn
- TensorFlow/PyTorch

## Bước 3: Các thuật toán cơ bản
- Linear Regression
- Logistic Regression
- Decision Trees
- Neural Networks`,
      published: true,
      views: 456,
      createdAt: new Date('2025-01-15')
    }
  });

  const blogPost3 = await prisma.blogPost.create({
    data: {
      userId: user1.id,
      title: 'React vs Vue vs Angular - Framework nào phù hợp với bạn?',
      content: `# So sánh Frontend Frameworks

## React
- Linh hoạt, ecosystem lớn
- JSX syntax
- Được Facebook phát triển

## Vue
- Dễ học, documentation tốt
- Template syntax
- Progressive framework

## Angular
- Full-featured, TypeScript
- Enterprise-ready
- Được Google phát triển`,
      published: true,
      views: 189,
      createdAt: new Date('2025-01-20')
    }
  });

  const blogPost4 = await prisma.blogPost.create({
    data: {
      userId: user2.id,
      title: 'UI/UX Design Principles mọi developer nên biết',
      content: `# UI/UX Best Practices

## 1. Consistency
Giữ nhất quán trong thiết kế

## 2. Feedback
Luôn có response với user action

## 3. Simplicity
Đơn giản là tốt nhất

## 4. Accessibility
Thiết kế cho tất cả mọi người`,
      published: true,
      views: 312,
      createdAt: new Date('2025-01-25')
    }
  });

  const blogPost5 = await prisma.blogPost.create({
    data: {
      userId: user4.id,
      title: 'Docker và Kubernetes cho newbie - Hướng dẫn từ A-Z',
      content: `# DevOps cho người mới

## Docker là gì?
Container hóa ứng dụng để deploy dễ dàng

## Kubernetes là gì?
Orchestration tool để quản lý containers

## Bắt đầu từ đâu?
1. Học Docker cơ bản
2. Viết Dockerfile
3. Docker Compose
4. Kubernetes concepts
5. Deploy lên cloud`,
      published: true,
      views: 523,
      createdAt: new Date('2025-01-28')
    }
  });

  const blogPost6 = await prisma.blogPost.create({
    data: {
      userId: user5.id,
      title: 'Data Science vs Data Analytics - Bạn nên chọn gì?',
      content: `# So sánh hai con đường

## Data Analytics
- Phân tích dữ liệu hiện tại
- SQL, Excel, Power BI
- Business insights
- Entry-level dễ hơn

## Data Science
- Dự đoán tương lai
- Python, ML, AI
- Build models
- Yêu cầu toán cao hơn

## Lời khuyên
Bắt đầu với Data Analytics, sau đó chuyển sang Data Science nếu thích!`,
      published: true,
      views: 687,
      createdAt: new Date('2025-02-01')
    }
  });

  const blogPost7 = await prisma.blogPost.create({
    data: {
      userId: user6.id,
      title: 'Top 10 thuật toán phải biết cho coding interview',
      content: `# Algorithms cho Interview

## 1. Binary Search
## 2. Two Pointers
## 3. Sliding Window
## 4. BFS/DFS
## 5. Dynamic Programming
## 6. Backtracking
## 7. Merge Sort
## 8. Quick Sort
## 9. Dijkstra Algorithm
## 10. Union Find

Practice trên LeetCode mỗi ngày!`,
      published: true,
      views: 892,
      createdAt: new Date('2025-02-05')
    }
  });

  const blogPost8 = await prisma.blogPost.create({
    data: {
      userId: user7.id,
      title: 'Figma Tips & Tricks cho designer năm 2025',
      content: `# Figma Advanced Techniques

## Auto Layout
Tạo responsive designs dễ dàng

## Components & Variants
Tái sử dụng elements hiệu quả

## Plugins must-have
- Iconify
- Unsplash
- Content Reel
- Remove BG

## Shortcuts
Ctrl+G: Group
Ctrl+Shift+K: Place image
Ctrl+Alt+C: Copy properties`,
      published: true,
      views: 445,
      createdAt: new Date('2025-02-08')
    }
  });

  const blogPost9 = await prisma.blogPost.create({
    data: {
      userId: user8.id,
      title: 'API Design Best Practices - RESTful vs GraphQL',
      content: `# Thiết kế API hiện đại

## RESTful API
- Dễ hiểu, dễ implement
- HTTP methods: GET, POST, PUT, DELETE
- Stateless
- Good for CRUD operations

## GraphQL
- Query exactly what you need
- Single endpoint
- No over-fetching
- Better for complex data relationships

## Khi nào dùng cái nào?
RESTful: Simple CRUD apps
GraphQL: Complex data requirements`,
      published: true,
      views: 621,
      createdAt: new Date('2025-02-10')
    }
  });

  const blogPost10 = await prisma.blogPost.create({
    data: {
      userId: user1.id,
      title: 'Git & GitHub workflows cho team collaboration',
      content: `# Git Best Practices

## Branch Strategy
- main: production code
- develop: integration branch
- feature/*: new features
- hotfix/*: urgent fixes

## Commit Messages
feat: new feature
fix: bug fix
docs: documentation
refactor: code refactoring
test: add tests

## Pull Request Tips
- Keep PRs small
- Write good descriptions
- Review carefully
- Use CI/CD`,
      published: true,
      views: 734,
      createdAt: new Date('2025-02-12')
    }
  });

  const blogPost11 = await prisma.blogPost.create({
    data: {
      userId: user3.id,
      title: 'CSS Flexbox vs Grid - Khi nào dùng cái nào?',
      content: `# Layout trong CSS

## Flexbox
- One-dimensional (row hoặc column)
- Align items dễ dàng
- Responsive navigation bars
- Card layouts

## Grid
- Two-dimensional (rows và columns)
- Complex layouts
- Magazine-style designs
- Full page layouts

## Pro tip
Kết hợp cả hai cho layouts phức tạp!`,
      published: true,
      views: 456,
      createdAt: new Date('2025-02-14')
    }
  });

  const blogPost12 = await prisma.blogPost.create({
    data: {
      userId: user4.id,
      title: 'Microservices Architecture cho beginners',
      content: `# Microservices 101

## Monolith vs Microservices
Monolith: All in one
Microservices: Separate services

## Ưu điểm
- Independent deployment
- Technology flexibility
- Scalability
- Team autonomy

## Nhược điểm
- Complexity
- Distributed system challenges
- More DevOps work

## Khi nào nên dùng?
Large apps, multiple teams, need scale`,
      published: true,
      views: 512,
      createdAt: new Date('2025-02-16')
    }
  });

  console.log('✓ Created 12 blog posts from various users');

  // 10. Create tags and Q&A
  console.log('\n🏷️ Creating tags and questions...');
  
  const tag1 = await prisma.tag.upsert({
    where: { name: 'javascript' },
    update: {},
    create: { name: 'javascript', description: 'Câu hỏi về JavaScript' }
  });

  const tag2 = await prisma.tag.upsert({
    where: { name: 'python' },
    update: {},
    create: { name: 'python', description: 'Câu hỏi về Python' }
  });

  const tag3 = await prisma.tag.upsert({
    where: { name: 'react' },
    update: {},
    create: { name: 'react', description: 'Câu hỏi về React' }
  });

  const tag4 = await prisma.tag.upsert({
    where: { name: 'algorithms' },
    update: {},
    create: { name: 'algorithms', description: 'Câu hỏi về thuật toán' }
  });

  const tag5 = await prisma.tag.upsert({
    where: { name: 'database' },
    update: {},
    create: { name: 'database', description: 'Câu hỏi về cơ sở dữ liệu' }
  });

  const tag6 = await prisma.tag.upsert({
    where: { name: 'docker' },
    update: {},
    create: { name: 'docker', description: 'DevOps và containerization' }
  });

  const tag7 = await prisma.tag.upsert({
    where: { name: 'data-science' },
    update: {},
    create: { name: 'data-science', description: 'Data Science và ML' }
  });

  const tag8 = await prisma.tag.upsert({
    where: { name: 'design' },
    update: {},
    create: { name: 'design', description: 'UI/UX Design' }
  });

  const tag9 = await prisma.tag.upsert({
    where: { name: 'api' },
    update: {},
    create: { name: 'api', description: 'API Design' }
  });

  const tag10 = await prisma.tag.upsert({
    where: { name: 'git' },
    update: {},
    create: { name: 'git', description: 'Git và version control' }
  });

  const tag11 = await prisma.tag.upsert({
    where: { name: 'css' },
    update: {},
    create: { name: 'css', description: 'CSS và styling' }
  });

  const tag12 = await prisma.tag.upsert({
    where: { name: 'architecture' },
    update: {},
    create: { name: 'architecture', description: 'Software architecture' }
  });

  // Link tags to blog posts
  await prisma.blogPostTag.createMany({
    data: [
      { blogPostId: blogPost1.id, tagId: tag1.id },
      { blogPostId: blogPost1.id, tagId: tag3.id },
      { blogPostId: blogPost2.id, tagId: tag2.id },
      { blogPostId: blogPost2.id, tagId: tag7.id },
      { blogPostId: blogPost3.id, tagId: tag1.id },
      { blogPostId: blogPost3.id, tagId: tag3.id },
      { blogPostId: blogPost4.id, tagId: tag3.id },
      { blogPostId: blogPost4.id, tagId: tag8.id },
      { blogPostId: blogPost5.id, tagId: tag6.id },
      { blogPostId: blogPost6.id, tagId: tag2.id },
      { blogPostId: blogPost6.id, tagId: tag7.id },
      { blogPostId: blogPost7.id, tagId: tag4.id },
      { blogPostId: blogPost7.id, tagId: tag2.id },
      { blogPostId: blogPost8.id, tagId: tag8.id },
      { blogPostId: blogPost9.id, tagId: tag9.id },
      { blogPostId: blogPost10.id, tagId: tag10.id },
      { blogPostId: blogPost11.id, tagId: tag11.id },
      { blogPostId: blogPost12.id, tagId: tag12.id }
    ]
  });

  console.log('✓ Created 12 tags and linked to 12 blog posts');

  // Question 1
  const question1 = await prisma.question.create({
    data: {
      userId: user1.id,
      subjectId: subject1.id,
      title: 'Sự khác nhau giữa let và var trong JavaScript?',
      content: `Tôi đang học JavaScript và thấy có cả let và var để khai báo biến. 

Ai có thể giải thích rõ sự khác biệt giữa chúng không? Khi nào nên dùng let, khi nào dùng var?

Cảm ơn!`,
      status: 'OPEN',
      views: 145,
      createdAt: new Date('2025-01-12')
    }
  });

  await prisma.questionTag.createMany({
    data: [
      { questionId: question1.id, tagId: tag1.id }
    ]
  });

  await prisma.answer.create({
    data: {
      questionId: question1.id,
      userId: user2.id,
      content: `Có 3 điểm khác biệt chính:

1. **Scope**: 
   - \`var\` có function scope
   - \`let\` có block scope

2. **Hoisting**:
   - \`var\` bị hoisting và có thể dùng trước khi khai báo (undefined)
   - \`let\` cũng bị hoisting nhưng nằm trong temporal dead zone

3. **Re-declaration**:
   - \`var\` có thể khai báo lại trong cùng scope
   - \`let\` không cho phép khai báo lại

**Khuyến nghị**: Luôn dùng \`let\` hoặc \`const\`, tránh dùng \`var\` trong code mới.`,
      isAccepted: true,
      createdAt: new Date('2025-01-12')
    }
  });

  // Question 2
  const question2 = await prisma.question.create({
    data: {
      userId: user2.id,
      subjectId: subject2.id,
      title: 'Làm thế nào để đảo ngược một linked list?',
      content: `Mình đang học về linked list và bị stuck ở bài tập đảo ngược linked list.

Có ai có thể giải thích thuật toán và cho ví dụ code không ạ?`,
      status: 'OPEN',
      views: 89,
      createdAt: new Date('2025-01-18')
    }
  });

  await prisma.questionTag.createMany({
    data: [
      { questionId: question2.id, tagId: tag4.id }
    ]
  });

  await prisma.answer.createMany({
    data: [
      {
        questionId: question2.id,
        userId: user1.id,
        content: `Có 2 cách chính:

**Cách 1: Iterative**
\`\`\`javascript
function reverseList(head) {
  let prev = null;
  let curr = head;
  
  while (curr !== null) {
    let next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  
  return prev;
}
\`\`\`

**Cách 2: Recursive**
\`\`\`javascript
function reverseList(head) {
  if (!head || !head.next) return head;
  
  let newHead = reverseList(head.next);
  head.next.next = head;
  head.next = null;
  
  return newHead;
}
\`\`\`

Cách 1 dễ hiểu hơn cho người mới học!`,
        createdAt: new Date('2025-01-18')
      }
    ]
  });

  // Question 3
  const question3 = await prisma.question.create({
    data: {
      userId: user1.id,
      subjectId: subject7.id,
      title: 'Pandas DataFrame vs NumPy Array - Khi nào nên dùng cái nào?',
      content: `Mình đang học Data Science và hơi confuse giữa Pandas DataFrame và NumPy array.

Khi nào thì nên dùng DataFrame, khi nào dùng array? Chúng khác nhau như thế nào về performance?`,
      status: 'OPEN',
      views: 67,
      createdAt: new Date('2025-01-22')
    }
  });

  await prisma.questionTag.createMany({
    data: [
      { questionId: question3.id, tagId: tag2.id }
    ]
  });

  // Question 4
  const question4 = await prisma.question.create({
    data: {
      userId: user4.id,
      subjectId: subject3.id,
      title: 'SQL JOIN types - INNER, LEFT, RIGHT, FULL OUTER',
      content: `Mình đang học SQL và bị rối về các loại JOIN.

Có ai có thể giải thích sự khác nhau giữa INNER JOIN, LEFT JOIN, RIGHT JOIN và FULL OUTER JOIN không?

Khi nào thì dùng loại nào?`,
      status: 'OPEN',
      views: 234,
      createdAt: new Date('2025-01-26')
    }
  });

  await prisma.questionTag.createMany({
    data: [
      { questionId: question4.id, tagId: tag5.id }
    ]
  });

  await prisma.answer.create({
    data: {
      questionId: question4.id,
      userId: user5.id,
      content: `Để dễ hiểu:

**INNER JOIN**: Chỉ lấy records có match ở CẢ 2 tables
\`\`\`sql
SELECT * FROM users u
INNER JOIN orders o ON u.id = o.user_id
-- Chỉ lấy users có orders
\`\`\`

**LEFT JOIN**: Lấy TẤT CẢ từ bảng bên trái + matching từ bảng phải
\`\`\`sql
SELECT * FROM users u
LEFT JOIN orders o ON u.id = o.user_id
-- Lấy tất cả users, kể cả không có orders
\`\`\`

**RIGHT JOIN**: Ngược lại với LEFT JOIN

**FULL OUTER JOIN**: Lấy tất cả từ cả 2 bảng

Hay dùng nhất là INNER và LEFT JOIN!`,
      isAccepted: true,
      createdAt: new Date('2025-01-27')
    }
  });

  // Question 5
  const question5 = await prisma.question.create({
    data: {
      userId: user6.id,
      subjectId: subject1.id,
      title: 'Promise vs Async/Await trong JavaScript - Best practice?',
      content: `Mình thấy có 2 cách handle asynchronous code: Promise chains và async/await.

Cách nào tốt hơn? Có nên migrate hết code từ Promise sang async/await không?`,
      status: 'OPEN',
      views: 178,
      createdAt: new Date('2025-02-01')
    }
  });

  await prisma.questionTag.createMany({
    data: [
      { questionId: question5.id, tagId: tag1.id }
    ]
  });

  await prisma.answer.createMany({
    data: [
      {
        questionId: question5.id,
        userId: user1.id,
        content: `Async/await là syntactic sugar của Promise, nên về bản chất giống nhau.

**Ưu điểm async/await:**
- Code dễ đọc hơn (giống synchronous code)
- Error handling với try/catch dễ hơn
- Debug dễ hơn

**Khi nào dùng Promise:**
- Multiple parallel requests: \`Promise.all()\`
- Promise chain đơn giản

**Best practice:**
\`\`\`javascript
// ✅ Good: parallel requests
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);

// ❌ Bad: sequential khi không cần
const users = await fetchUsers();
const posts = await fetchPosts();
\`\`\`

Async/await là modern standard, nên dùng!`,
        createdAt: new Date('2025-02-02')
      }
    ]
  });

  // Question 6
  const question6 = await prisma.question.create({
    data: {
      userId: user7.id,
      subjectId: subject9.id,
      title: 'Color theory cho UI design - Làm sao chọn màu hợp lý?',
      content: `Mình là developer đang tự học UI design. Mỗi lần chọn màu cho app đều rất struggle.

Có tips gì để chọn color palette hợp lý không? Có tool nào recommend không?`,
      status: 'OPEN',
      views: 145,
      createdAt: new Date('2025-02-03')
    }
  });

  await prisma.questionTag.createMany({
    data: [
      { questionId: question6.id, tagId: tag8.id }
    ]
  });

  await prisma.answer.create({
    data: {
      questionId: question6.id,
      userId: user2.id,
      content: `Một số tips:

**1. Chọn 1 màu chủ đạo**
Dựa vào brand hoặc cảm xúc muốn truyền tải

**2. Dùng 60-30-10 rule**
- 60% dominant color
- 30% secondary color  
- 10% accent color

**3. Tools hữu ích:**
- Coolors.co: Generate palettes
- Adobe Color: Color wheel
- Material Design colors
- TailwindCSS colors

**4. Contrast ratio**
WCAG AA standard: 4.5:1 cho text
Check trên WebAIM Contrast Checker

**5. Tham khảo:**
Dribbble, Behance để xem designs của pro!`,
      isAccepted: false,
      createdAt: new Date('2025-02-04')
    }
  });

  // Question 7 - No answers yet
  const question7 = await prisma.question.create({
    data: {
      userId: user8.id,
      subjectId: subject1.id,
      title: 'React useEffect cleanup function - Khi nào cần dùng?',
      content: `Mình thấy docs React có nói về cleanup function trong useEffect:

\`\`\`javascript
useEffect(() => {
  // effect
  return () => {
    // cleanup
  };
}, []);
\`\`\`

Khi nào thì cần dùng cleanup? Có ví dụ thực tế không?`,
      status: 'OPEN',
      views: 92,
      createdAt: new Date('2025-02-06')
    }
  });

  await prisma.questionTag.createMany({
    data: [
      { questionId: question7.id, tagId: tag3.id }
    ]
  });

  // Question 8 - Multiple answers, not accepted yet
  const question8 = await prisma.question.create({
    data: {
      userId: user3.id,
      subjectId: subject7.id,
      title: 'Machine Learning model overfitting - Làm sao khắc phục?',
      content: `Model của mình train accuracy 98% nhưng test accuracy chỉ 65%.

Mình biết đây là overfitting. Có cách nào khắc phục không ạ?`,
      status: 'OPEN',
      views: 267,
      createdAt: new Date('2025-02-08')
    }
  });

  await prisma.questionTag.createMany({
    data: [
      { questionId: question8.id, tagId: tag2.id },
      { questionId: question8.id, tagId: tag7.id }
    ]
  });

  await prisma.answer.createMany({
    data: [
      {
        questionId: question8.id,
        userId: user5.id,
        content: `Một số techniques:

**1. More training data**
Cách tốt nhất nhưng không phải lúc nào cũng có

**2. Regularization**
- L1/L2 regularization
- Dropout layers

**3. Cross-validation**
K-fold CV để đánh giá model tốt hơn

**4. Reduce model complexity**
Giảm số layers hoặc neurons

**5. Data augmentation**
Với image: rotate, flip, crop
Với text: synonym replacement

**6. Early stopping**
Stop training khi validation loss tăng`,
        createdAt: new Date('2025-02-09')
      },
      {
        questionId: question8.id,
        userId: user1.id,
        content: `Thêm 1 tip: Feature engineering

Đôi khi mình có quá nhiều features không cần thiết. Hãy thử:
- Feature selection
- PCA (Principal Component Analysis)
- Remove correlated features

Và nhớ plot learning curves để visualize overfitting!`,
        createdAt: new Date('2025-02-10')
      }
    ]
  });

  // Question 9
  const question9 = await prisma.question.create({
    data: {
      userId: user5.id,
      subjectId: subject3.id,
      title: 'PostgreSQL vs MySQL - Nên chọn database nào?',
      content: `Mình đang start project mới và phân vân giữa PostgreSQL và MySQL.

Ai có kinh nghiệm có thể advice không? Điểm mạnh/yếu của từng cái là gì?`,
      status: 'OPEN',
      views: 198,
      createdAt: new Date('2025-02-11')
    }
  });

  await prisma.questionTag.createMany({
    data: [
      { questionId: question9.id, tagId: tag5.id }
    ]
  });

  await prisma.answer.create({
    data: {
      questionId: question9.id,
      userId: user8.id,
      content: `Cả 2 đều tốt, nhưng có điểm khác:

**PostgreSQL:**
✅ ACID compliance mạnh hơn
✅ Advanced features: JSON, arrays, full-text search
✅ Better for complex queries
✅ Extensible (custom functions, types)
❌ Setup phức tạp hơn
❌ Ít hosting providers hơn

**MySQL:**
✅ Easier to setup
✅ Faster cho read-heavy workloads
✅ Nhiều hosting options
✅ Large community
❌ Ít features nâng cao hơn

**Recommendation:**
- Complex apps, need JSON, advanced queries → PostgreSQL
- Simple CRUD, need speed, easy deploy → MySQL

Mình thích PostgreSQL hơn vì powerful!`,
      isAccepted: true,
      createdAt: new Date('2025-02-12')
    }
  });

  // Question 10 - No answer yet
  const question10 = await prisma.question.create({
    data: {
      userId: user4.id,
      subjectId: subject5.id,
      title: 'Docker multi-stage build - Tại sao nên dùng?',
      content: `Mình thấy nhiều Dockerfile dùng multi-stage build:

\`\`\`dockerfile
FROM node:18 AS builder
# build steps...

FROM node:18-alpine
COPY --from=builder /app/dist ./dist
\`\`\`

Tại sao không build luôn trong 1 stage? Advantages là gì?`,
      status: 'OPEN',
      views: 156,
      createdAt: new Date('2025-02-13')
    }
  });

  await prisma.questionTag.createMany({
    data: [
      { questionId: question10.id, tagId: tag6.id }
    ]
  });

  console.log('✓ Created 12 tags, 10 questions with various answer statuses');

  console.log('\n✅ Seeding completed successfully!\n');
  console.log('� Database Summary:');
  console.log('  ✓ 8 users (1 admin + 7 students)');
  console.log('  ✓ 6 majors (IT, Math, Data Science, Design, Business, Software Engineering)');
  console.log('  ✓ 15 enrollments (users enrolled in various majors)');
  console.log('  ✓ 10 subjects with 40 lessons');
  console.log('  ✓ 4 exams with 60 questions');
  console.log('  ✓ 12 blog posts from various users');
  console.log('  ✓ 12 tags');
  console.log('  ✓ 10 Q&A questions with answers\n');
  console.log('�📝 Demo accounts (all passwords: 123456):');
  console.log('  👑 Admin: admin@learnhub.com / admin123');
  console.log('  👤 User1: student@example.com (ACTIVE, enrolled: IT + Data Science)');
  console.log('  👤 User2: student2@example.com (APPROVED, enrolled: Math + Design)');
  console.log('  👤 User3: pending@example.com (PENDING, enrolled: IT)');
  console.log('  👤 User4: user4@example.com (ACTIVE, enrolled: IT + Software Engineering)');
  console.log('  👤 User5: user5@example.com (ACTIVE, enrolled: Data Science + Business)');
  console.log('  👤 User6: user6@example.com (ACTIVE, enrolled: IT + Data Science)');
  console.log('  👤 User7: user7@example.com (ACTIVE, enrolled: Design + Business)');
  console.log('  👤 User8: user8@example.com (ACTIVE, enrolled: Math + Software Engineering)\n');
  console.log('🎯 Test Features:');
  console.log('  • Chat friend suggestions: Users with shared majors');
  console.log('  • Q&A filtering: By major → subject');
  console.log('  • Blog posts: From various authors with tags');
  console.log('  • Face recognition: Lesson progress tracking\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



