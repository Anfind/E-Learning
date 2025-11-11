const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmbeddings() {
  console.log('\n========== CHECKING FACE EMBEDDINGS ==========\n');

  const users = await prisma.user.findMany({
    where: {
      faceRegistered: true
    },
    select: {
      id: true,
      email: true,
      name: true,
      faceRegistered: true,
      faceEmbedding: true
    }
  });

  console.log(`Found ${users.length} users with registered faces:\n`);

  const embeddings = [];
  
  for (const user of users) {
    const embedding = JSON.parse(user.faceEmbedding);
    
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Dimensions: ${embedding.length}D`);
    console.log(`  First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
    console.log(`  Sum: ${embedding.reduce((a, b) => a + b, 0).toFixed(4)}`);
    console.log(`  Mean: ${(embedding.reduce((a, b) => a + b, 0) / embedding.length).toFixed(4)}`);
    console.log('');

    embeddings.push({
      user: user.name,
      email: user.email,
      embedding: embedding
    });
  }

  // Calculate distances between all pairs
  if (embeddings.length >= 2) {
    console.log('\n========== PAIRWISE DISTANCES ==========\n');
    
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        const emb1 = embeddings[i].embedding;
        const emb2 = embeddings[j].embedding;
        
        // Euclidean distance
        let sum = 0;
        for (let k = 0; k < emb1.length; k++) {
          const diff = emb1[k] - emb2[k];
          sum += diff * diff;
        }
        const distance = Math.sqrt(sum);
        
        console.log(`${embeddings[i].user} <-> ${embeddings[j].user}`);
        console.log(`  Distance: ${distance.toFixed(4)}`);
        console.log(`  Threshold: 0.4 (for 10D model)`);
        console.log(`  Result: ${distance < 0.4 ? '✅ SAME PERSON (WRONG!)' : '❌ DIFFERENT (CORRECT)'}`);
        console.log('');
      }
    }
  }

  console.log('===========================================\n');
  
  await prisma.$disconnect();
}

checkEmbeddings().catch(console.error);
