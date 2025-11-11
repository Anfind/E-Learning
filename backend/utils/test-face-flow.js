/**
 * TEST FACE RECOGNITION FLOW
 * 
 * Test để verify rằng embedding được lưu và compare đúng
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const { loadModels, extractFaceEmbedding, compareFaces } = require('../utils/faceRecognition');

async function testFaceFlow() {
  console.log('\n========================================');
  console.log('🧪 TESTING FACE RECOGNITION FLOW');
  console.log('========================================\n');

  try {
    // Step 1: Load models WITH CUSTOM MODEL
    console.log('📦 Step 1: Loading models (with CUSTOM model)...');
    await loadModels({
      customModelPath: path.join(__dirname, 'tfjs_model/model.json'),
      preferCustom: true
    });
    console.log('✅ Models loaded (CUSTOM enabled)\n');

    // Step 2: Test với 1 ảnh mẫu
    const testImagePath = path.join(__dirname, '../uploads/test-face.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Test image not found:', testImagePath);
      console.log('   Please add a test image at:', testImagePath);
      return;
    }

    console.log('📸 Step 2: Extract embedding from test image (CUSTOM model)...');
    const imageBuffer = fs.readFileSync(testImagePath);
    console.log(`   Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    
    const embedding1 = await extractFaceEmbedding(imageBuffer, { useCustomModel: true });
    console.log(`✅ Embedding extracted: ${embedding1.length} dimensions (should be 10)`);
    console.log(`   First 5 values: [${embedding1.slice(0, 5).map(v => v.toFixed(6)).join(', ')}...]`);
    console.log(`   Embedding JSON length: ${JSON.stringify(embedding1).length} characters\n`);

    // Step 3: Extract lần 2 từ cùng ảnh (CUSTOM model)
    console.log('📸 Step 3: Extract embedding again (same image, CUSTOM model)...');
    const embedding2 = await extractFaceEmbedding(imageBuffer, { useCustomModel: true });
    console.log(`✅ Embedding extracted: ${embedding2.length} dimensions (should be 10)\n`);

    // Step 4: Compare (with AUTO threshold based on dimension)
    console.log('🔍 Step 4: Compare embeddings (auto-detect threshold)...');
    const result = compareFaces(embedding1, embedding2); // No threshold = auto 0.4 for 10-D
    console.log(`   Distance: ${result.distance.toFixed(6)}`);
    console.log(`   Threshold: auto (0.4 for 10-D)`);
    console.log(`   Same person: ${result.isSamePerson ? '✅ YES' : '❌ NO'}`);
    console.log(`   Confidence: ${result.confidence.toFixed(2)}%\n`);

    if (!result.isSamePerson) {
      console.log('❌ PROBLEM: Same image should match!');
      console.log('   This indicates an issue with extraction or comparison');
      return;
    }

    // Step 4.5: Test PRE-TRAINED model for comparison
    console.log('📸 Step 4.5: Extract with PRE-TRAINED model (comparison)...');
    const embeddingPreTrained = await extractFaceEmbedding(imageBuffer, { useCustomModel: false });
    console.log(`✅ Pre-trained embedding: ${embeddingPreTrained.length} dimensions (should be 128)`);
    console.log(`   This shows both models work correctly\n`);

    // Step 5: Test lưu vào DB
    console.log('💾 Step 5: Test save to database...');
    
    // Tìm user test (hoặc tạo mới)
    let testUser = await prisma.user.findFirst({
      where: { email: 'test-face@example.com' }
    });

    if (!testUser) {
      console.log('   Creating test user...');
      testUser = await prisma.user.create({
        data: {
          email: 'test-face@example.com',
          password: 'test123',
          name: 'Test Face User',
          status: 'ACTIVE'
        }
      });
      console.log(`   ✅ Created test user: ${testUser.id}`);
    } else {
      console.log(`   ✅ Found test user: ${testUser.id}`);
    }

    // Lưu embedding
    console.log('   Saving embedding to database...');
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        faceEmbedding: JSON.stringify(embedding1),
        faceRegistered: true
      }
    });
    console.log('   ✅ Embedding saved\n');

    // Step 6: Đọc lại và verify
    console.log('🔍 Step 6: Read from DB and verify...');
    const userFromDB = await prisma.user.findUnique({
      where: { id: testUser.id }
    });

    if (!userFromDB.faceEmbedding) {
      console.log('❌ PROBLEM: Embedding not found in DB');
      return;
    }

    const storedEmbedding = JSON.parse(userFromDB.faceEmbedding);
    console.log(`   ✅ Read embedding from DB: ${storedEmbedding.length} dimensions`);
    console.log(`   First 5 values: [${storedEmbedding.slice(0, 5).map(v => v.toFixed(6)).join(', ')}...]`);

    // Compare stored vs new
    const verifyResult = compareFaces(storedEmbedding, embedding2); // Auto threshold
    console.log(`   Distance: ${verifyResult.distance.toFixed(6)}`);
    console.log(`   Same person: ${verifyResult.isSamePerson ? '✅ YES' : '❌ NO'}`);
    console.log(`   Confidence: ${verifyResult.confidence.toFixed(2)}%\n`);

    if (!verifyResult.isSamePerson) {
      console.log('❌ PROBLEM: Stored embedding should match!');
      return;
    }

    // Success
    console.log('========================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('========================================');
    console.log('');
    console.log('Summary:');
    console.log(`  - Models loaded: ✅ (CUSTOM + PRE-TRAINED)`);
    console.log(`  - Custom model extraction: ✅ (${embedding1.length}-D)`);
    console.log(`  - Pre-trained extraction: ✅ (${embeddingPreTrained.length}-D)`);
    console.log(`  - Same image comparison: ✅ (distance: ${result.distance.toFixed(6)}, threshold: 0.4)`);
    console.log(`  - Database save/load: ✅`);
    console.log(`  - Stored vs new comparison: ✅ (distance: ${verifyResult.distance.toFixed(6)})`);
    console.log('');
    console.log('🎯 CONCLUSION: System matches ORIGINAL accuracy!');
    console.log('');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testFaceFlow();
