import { useState, useRef } from 'react';
import { Form, ProgressBar, Button, Alert } from 'react-bootstrap';
import { FaCloudUploadAlt, FaFilePdf, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api/axios';

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

export default function IDUploadForm({ onUploadSuccess, required = true }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleFileSelect = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError('Please upload a jpg, png, or pdf file');
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setError('File size cannot exceed 10MB');
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('idDocument', file);

      const response = await api.post('/auth/upload-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        },
      });

      toast.success('ID uploaded successfully');
      onUploadSuccess?.(response.url);
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || 'There was a problem uploading');
    } finally {
      setUploading(false);
    }
  };

  const isPdf = file && file.type === 'application/pdf';

  return (
    <div className="id-upload-form">
      <div
        className={`upload-zone border rounded p-4 text-center ${
          error ? 'border-danger' : 'border-secondary'
        }`}
        style={{
          border: '2px dashed',
          cursor: 'pointer',
          backgroundColor: preview ? 'transparent' : '#f8f9fa',
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {preview ? (
          <img
            src={preview}
            alt="Preview"
            style={{ maxHeight: 200, maxWidth: '100%' }}
          />
        ) : isPdf ? (
          <FaFilePdf size={48} className="text-danger" />
        ) : (
          <FaCloudUploadAlt size={48} className="text-muted mb-2" />
        )}

        <div className="mt-2">
          {file ? (
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-truncate">{file.name}</span>
              <Button
                variant="outline-danger"
                size="sm"
                className="ms-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview(null);
                }}
              >
                X
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-0">Click or drag here to upload</p>
              <small className="text-muted">jpg, png, pdf (maximum 10MB)</small>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mt-2">
          {error}
        </Alert>
      )}

      {uploading && (
        <ProgressBar
          now={progress}
          animated
          label={`${progress}%`}
          className="mt-2"
        />
      )}

      <div className="mt-3 d-flex justify-content-between align-items-center">
        <small className="text-muted d-flex align-items-center gap-1">
          <FaInfoCircle size={12} />
          Why is this required?
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            For your safety and to build trust with the book owner
          </span>
        </small>
        {file && !uploading && (
          <Button variant="primary" size="sm" onClick={handleUpload}>
            Upload
          </Button>
        )}
      </div>
    </div>
  );
}
