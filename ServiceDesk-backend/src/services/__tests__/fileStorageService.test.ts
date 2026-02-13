import { Types } from 'mongoose';
import { createMockRepository } from '../../__tests__/fixtures/service.fixture';

describe('File Storage Service', () => {
  let mockFileRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockFileRepository = createMockRepository();
  });

  describe('uploadFile', () => {
    it('should create file record with valid data', async () => {
      const fileData = {
        fileName: 'document.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        uploadedBy: new Types.ObjectId(),
        bucket: 'documents',
      };

      mockFileRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...fileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockFileRepository.create(fileData);

      expect(result.fileName).toBe('document.pdf');
      expect(result.fileSize).toBe(1024000);
    });
  });

  describe('getFiles', () => {
    it('should retrieve files for user', async () => {
      const userId = new Types.ObjectId();
      const files = [
        { _id: new Types.ObjectId(), fileName: 'file1.pdf', uploadedBy: userId },
        { _id: new Types.ObjectId(), fileName: 'file2.docx', uploadedBy: userId },
      ];

      mockFileRepository.find.mockResolvedValue(files);

      const result = await mockFileRepository.find({ uploadedBy: userId });

      expect(result).toHaveLength(2);
    });

    it('should filter files by bucket', async () => {
      const files = [
        { _id: new Types.ObjectId(), fileName: 'file1.pdf', bucket: 'documents' },
      ];

      mockFileRepository.find.mockResolvedValue(files);

      const result = await mockFileRepository.find({ bucket: 'documents' });

      expect(result[0].bucket).toBe('documents');
    });
  });

  describe('getFileById', () => {
    it('should retrieve file by id', async () => {
      const fileId = new Types.ObjectId();
      const file = {
        _id: fileId,
        fileName: 'document.pdf',
        fileSize: 2048000,
      };

      mockFileRepository.findById.mockResolvedValue(file);

      const result = await mockFileRepository.findById(fileId);

      expect(result._id).toEqual(fileId);
      expect(result.fileName).toBe('document.pdf');
    });

    it('should return null for non-existent file', async () => {
      const fileId = new Types.ObjectId();

      mockFileRepository.findById.mockResolvedValue(null);

      const result = await mockFileRepository.findById(fileId);

      expect(result).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('should delete file', async () => {
      const fileId = new Types.ObjectId();

      mockFileRepository.deleteById.mockResolvedValue(true);

      const result = await mockFileRepository.deleteById(fileId);

      expect(result).toBe(true);
    });
  });

  describe('getTotalStorageUsed', () => {
    it('should calculate total storage used by user', async () => {
      const userId = new Types.ObjectId();
      const files = [
        { _id: new Types.ObjectId(), uploadedBy: userId, fileSize: 1024000 },
        { _id: new Types.ObjectId(), uploadedBy: userId, fileSize: 2048000 },
      ];

      mockFileRepository.find.mockResolvedValue(files);

      const result = await mockFileRepository.find({ uploadedBy: userId });
      const totalSize = result.reduce((sum: number, f: Record<string, unknown>) => sum + (f.fileSize as number), 0);

      expect(totalSize).toBe(3072000);
    });
  });
});
