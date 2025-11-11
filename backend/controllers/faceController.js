const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { extractFaceEmbedding, compareFaces, areModelsLoaded } = require("../utils/faceRecognition");

// Constants
const FACE_VERIFICATION_THRESHOLD = 0.6;
const MAX_EXTRACTION_TIME = 30000; // 30 seconds

/**
 * @desc    Register USER face (self-registration)
 * @route   POST /api/auth/register-face
 * @access  Private (User)
 */
const registerFace = async (req, res) => {
  const requestStart = Date.now();

  try {
    const userId = req.user.id; // From JWT auth middleware

    console.log('[FACE] Registering face for userId:', userId);

    if (!req.file) {
      console.log('[FACE] No file uploaded');
      return res.status(400).json({
        success: false,
        message: "Image file is required"
      });
    }

    console.log(`[FACE] File: ${req.file.originalname}, ${(req.file.size / 1024).toFixed(2)} KB`);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!areModelsLoaded()) {
      console.log('[FACE] Models not ready');
      return res.status(503).json({
        success: false,
        message: "Face recognition service is not ready. Please try again later."
      });
    }

    // ✅ Extract face embedding with CUSTOM MODEL
    let embeddingArray;
    try {
      const start = Date.now();
      console.log('[FACE] Starting face embedding extraction at', new Date(start).toISOString());

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Extraction timeout')), MAX_EXTRACTION_TIME);
      });

      embeddingArray = await Promise.race([
        extractFaceEmbedding(req.file.buffer, { useCustomModel: true }), // ✅ Use custom 10D model (SAME AS ORIGINAL)
        timeoutPromise
      ]);

      const end = Date.now();
      const duration = end - start;
      console.log(`[FACE] Finished extraction at ${new Date(end).toISOString()}`);
      console.log(`[FACE] Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);

    } catch (error) {
      console.log(`[FACE] Extraction failed: ${error.message}`);

      if (error.message === 'Extraction timeout') {
        return res.status(408).json({
          success: false,
          message: "Image processing took too long. Please try with a smaller or clearer image."
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || "Unable to extract face from image"
      });
    }

    // ✅ Accept multiple embedding dimensions (10, 128, or 512) - same as original system
    const validDimensions = [10, 128, 512];
    if (!embeddingArray || !validDimensions.includes(embeddingArray.length)) {
      console.log(`[FACE] Invalid embedding: ${embeddingArray?.length || 0} dimensions`);
      return res.status(400).json({
        success: false,
        message: "Invalid face data"
      });
    }

    console.log('[FACE] Valid embedding: ' + embeddingArray.length + ' dimensions');
    console.log('[FACE] Updating database...');
    const dbStart = Date.now();

    // Save ONLY EMBEDDING to USER (không lưu ảnh gốc - giống hệ thống cũ)
    const userUpdated = await prisma.user.update({
      where: { id: userId },
      data: {
        faceEmbedding: JSON.stringify(embeddingArray),
        faceRegistered: true
        // KHÔNG lưu faceImage - chỉ lưu embedding
      },
      select: {
        id: true,
        email: true,
        name: true,
        faceRegistered: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const dbDuration = Date.now() - dbStart;
    console.log(`[FACE] Database updated in ${dbDuration}ms`);

    const totalDuration = Date.now() - requestStart;
    console.log('\n' + '═'.repeat(55));
    console.log(`[FACE] SUCCESS - Total: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    console.log('═'.repeat(55) + '\n');

    res.status(200).json({
      success: true,
      message: "Face registered successfully",
      data: { user: userUpdated }
    });

  } catch (error) {
    const totalDuration = Date.now() - requestStart;
    console.error(`\n[FACE] ERROR after ${totalDuration}ms:`, error.message);
    console.log('═'.repeat(55) + '\n');

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while processing face"
    });
  }
};

/**
 * @desc    Verify USER face (can verify any user - for testing)
 * @route   POST /api/face/verify
 * @access  Private (User)
 */
const verifyFace = async (req, res) => {
  const requestStart = Date.now();

  try {
    // ✅ Get userId from request body (for testing different users)
    // If not provided, default to logged-in user (self-verification)
    const targetUserId = req.body.userId || req.user.id;
    const currentUserId = req.user.id;

    console.log('[FACE] Verifying face for targetUserId:', targetUserId);
    console.log('[FACE] Requested by userId:', currentUserId);
    console.log(`[FACE] Threshold: ${FACE_VERIFICATION_THRESHOLD}`);

    if (!req.file) {
      console.log('[FACE] No file uploaded');
      return res.status(400).json({
        success: false,
        message: "Image file is required"
      });
    }

    console.log(`[FACE] File: ${req.file.originalname}, ${(req.file.size / 1024).toFixed(2)} KB`);

    // Get target user (the one we want to verify against)
    console.log('[FACE] Fetching target user...');
    const dbStart = Date.now();

    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.faceRegistered || !user.faceEmbedding) {
      console.log('[FACE] User has no registered face');
      return res.status(400).json({
        success: false,
        message: "You have not registered your face yet. Please register first."
      });
    }

    console.log(`[FACE] User fetched in ${Date.now() - dbStart}ms`);

    const storedEmbedding = JSON.parse(user.faceEmbedding);
    console.log(`[FACE] User has face (${storedEmbedding.length}D)`);

    if (!areModelsLoaded()) {
      console.log('[FACE] Models not ready');
      return res.status(503).json({
        success: false,
        message: "Face recognition service is not ready. Please try again later."
      });
    }

    // ✅ Extract face from uploaded image with CUSTOM MODEL
    console.log('[FACE] Extracting face from uploaded image...');
    let newEmbedding;
    try {
      const extractStart = Date.now();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Extraction timeout')), MAX_EXTRACTION_TIME);
      });

      newEmbedding = await Promise.race([
        extractFaceEmbedding(req.file.buffer, { useCustomModel: true }), // ✅ Use custom 10D model (SAME AS ORIGINAL)
        timeoutPromise
      ]);

      console.log(`[FACE] Extraction done in ${Date.now() - extractStart}ms`);

    } catch (error) {
      console.log(`[FACE] Extraction failed: ${error.message}`);

      if (error.message === 'Extraction timeout') {
        return res.status(408).json({
          success: false,
          message: "Image processing took too long. Please try again."
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || "Unable to extract face from image"
      });
    }

    // Compare faces
    console.log('[FACE] Comparing faces...');
    const compareStart = Date.now();
    const result = compareFaces(storedEmbedding, newEmbedding); // ✅ Let it auto-detect threshold (0.4 for 10D, 0.6 for 128D)
    console.log(`[FACE] Comparison done in ${Date.now() - compareStart}ms`);

    const totalDuration = Date.now() - requestStart;

    if (result.isSamePerson) {
      console.log(`\n[FACE] VERIFIED - Distance: ${result.distance} < Threshold: ${result.threshold}`); // ✅ Use actual threshold from result
      console.log('═'.repeat(55));
      console.log(`[FACE] SUCCESS - Total: ${totalDuration}ms`);
      console.log('═'.repeat(55) + '\n');

      return res.status(200).json({
        success: true,
        message: "Face verification successful",
        data: {
          verified: true,
          confidence: result.confidence.toFixed(2),
          user: {
            id: user.id,
            name: user.name
          }
        }
      });
    } else {
      console.log(`\n[FACE] REJECTED - Distance: ${result.distance} >= Threshold: ${result.threshold}`);
      console.log('═'.repeat(55));
      console.log(`[FACE] FAILED - Total: ${totalDuration}ms`);
      console.log('═'.repeat(55) + '\n');

      return res.status(400).json({ // ✅ Changed from 401 to 400 (face mismatch is not auth error)
        success: false,
        message: "Face does not match. Please try again.",
        data: {
          verified: false,
          confidence: result.confidence.toFixed(2)
        }
      });
    }

  } catch (error) {
    const totalDuration = Date.now() - requestStart;
    console.error(`\n[FACE] ERROR after ${totalDuration}ms:`, error.message);
    console.log('═'.repeat(55) + '\n');

    res.status(500).json({
      success: false,
      message: "Server error while verifying face"
    });
  }
};

/**
 * @desc    Get face registration status
 * @route   GET /api/face/status
 * @access  Private (User)
 */
const getFaceStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        faceRegistered: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        modelsLoaded: areModelsLoaded()
      }
    });

  } catch (error) {
    console.error('[FACE] Error getting status:', error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  registerFace,
  verifyFace,
  getFaceStatus
};
