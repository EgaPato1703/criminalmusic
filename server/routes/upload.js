const express = require('express');
const multer = require('multer');
const { authenticateToken, requireArtist } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const config = require('../config');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    if (config.ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Неподдерживаемый формат аудио. Разрешены: MP3, WAV, OGG', 400, 'INVALID_AUDIO_FORMAT'), false);
    }
  } else if (file.fieldname === 'image' || file.fieldname === 'avatar') {
    if (config.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Неподдерживаемый формат изображения. Разрешены: JPEG, PNG, WebP', 400, 'INVALID_IMAGE_FORMAT'), false);
    }
  } else {
    cb(new AppError('Неизвестный тип файла', 400, 'UNKNOWN_FILE_TYPE'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE_BYTES
  }
});

// Simulate file upload to cloud storage (placeholder)
const uploadToCloud = async (file, folder = 'tracks') => {
  // In production, implement actual cloud storage upload (AWS S3, Google Cloud, etc.)
  // For now, return a mock response
  
  const timestamp = Date.now();
  const filename = `${folder}/${timestamp}-${file.originalname}`;
  
  return {
    url: `https://storage.criminal-music.com/${filename}`,
    publicId: `criminal_music_${timestamp}`,
    size: file.size,
    format: file.mimetype.split('/')[1]
  };
};

// Get audio metadata (placeholder)
const getAudioMetadata = async (buffer) => {
  // In production, use a library like node-ffmpeg or music-metadata
  // For now, return mock metadata
  
  return {
    duration: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
    bitrate: 320,
    sampleRate: 44100
  };
};

// Upload audio file
router.post('/audio', 
  authenticateToken, 
  requireArtist, 
  upload.single('audio'), 
  catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('Аудиофайл не найден', 400, 'NO_AUDIO_FILE');
    }
    
    // Get audio metadata
    const metadata = await getAudioMetadata(req.file.buffer);
    
    // Upload to cloud storage
    const uploadResult = await uploadToCloud(req.file, 'audio');
    
    // Prepare response
    const audioFile = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      size: uploadResult.size,
      duration: metadata.duration,
      format: uploadResult.format,
      bitrate: metadata.bitrate,
      sampleRate: metadata.sampleRate
    };
    
    res.json({
      success: true,
      message: 'Аудиофайл загружен в тайник',
      data: { audioFile }
    });
  })
);

// Upload image (cover art or avatar)
router.post('/image', 
  authenticateToken, 
  upload.single('image'), 
  catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('Изображение не найдено', 400, 'NO_IMAGE_FILE');
    }
    
    const { type = 'cover' } = req.body; // 'cover', 'avatar', 'album'
    
    // Upload to cloud storage
    const uploadResult = await uploadToCloud(req.file, `images/${type}`);
    
    // Create thumbnail for covers (placeholder)
    let thumbnail = null;
    if (type === 'cover' || type === 'album') {
      thumbnail = uploadResult.url.replace('.jpg', '_thumb.jpg');
    }
    
    const imageData = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      thumbnail: thumbnail
    };
    
    res.json({
      success: true,
      message: 'Изображение загружено в архив',
      data: { image: imageData }
    });
  })
);

// Upload multiple files (for album)
router.post('/batch', 
  authenticateToken, 
  requireArtist, 
  upload.fields([
    { name: 'audio', maxCount: 20 },
    { name: 'cover', maxCount: 1 }
  ]), 
  catchAsync(async (req, res) => {
    const audioFiles = req.files.audio || [];
    const coverFiles = req.files.cover || [];
    
    if (audioFiles.length === 0) {
      throw new AppError('Нет аудиофайлов для загрузки', 400, 'NO_AUDIO_FILES');
    }
    
    const uploadedTracks = [];
    
    // Process audio files
    for (const file of audioFiles) {
      const metadata = await getAudioMetadata(file.buffer);
      const uploadResult = await uploadToCloud(file, 'audio');
      
      uploadedTracks.push({
        originalName: file.originalname,
        audioFile: {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          size: uploadResult.size,
          duration: metadata.duration,
          format: uploadResult.format,
          bitrate: metadata.bitrate,
          sampleRate: metadata.sampleRate
        }
      });
    }
    
    // Process cover art if provided
    let coverArt = null;
    if (coverFiles.length > 0) {
      const coverResult = await uploadToCloud(coverFiles[0], 'images/covers');
      coverArt = {
        url: coverResult.url,
        publicId: coverResult.publicId,
        thumbnail: coverResult.url.replace('.jpg', '_thumb.jpg')
      };
    }
    
    res.json({
      success: true,
      message: `${uploadedTracks.length} файлов загружено в тайник`,
      data: { 
        tracks: uploadedTracks,
        coverArt
      }
    });
  })
);

// Get upload progress (for large files)
router.get('/progress/:uploadId', authenticateToken, catchAsync(async (req, res) => {
  const { uploadId } = req.params;
  
  // In production, implement actual progress tracking
  // For now, return mock progress
  
  const progress = Math.floor(Math.random() * 100);
  
  res.json({
    success: true,
    data: {
      uploadId,
      progress,
      status: progress === 100 ? 'completed' : 'uploading'
    }
  });
}));

// Delete uploaded file
router.delete('/:publicId', authenticateToken, catchAsync(async (req, res) => {
  const { publicId } = req.params;
  
  // In production, implement actual file deletion from cloud storage
  // For now, just acknowledge the request
  
  res.json({
    success: true,
    message: 'Файл удалён из тайника'
  });
}));

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: `Файл слишком большой. Максимум: ${config.MAX_FILE_SIZE_MB}MB`,
        code: 'FILE_TOO_LARGE'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Слишком много файлов за раз',
        code: 'TOO_MANY_FILES'
      });
    }
    
    return res.status(400).json({
      error: 'Upload error',
      message: 'Ошибка загрузки файла',
      code: 'UPLOAD_ERROR'
    });
  }
  
  next(error);
});

module.exports = router;
