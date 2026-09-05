import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { getAvatarUrl, DEFAULT_AVATAR } from '../../services/api';
import {
  X,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Shield,
  Loader2,
  Building,
  GraduationCap,
  Trash2
} from 'lucide-react';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen || !user) return null;

  const allowedExtensions = ['jpg', 'jpeg', 'png'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/pjpeg'];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const mime = file.type?.toLowerCase();

    if (!allowedExtensions.includes(ext) && !allowedMimeTypes.includes(mime)) {
      setErrorMsg('Invalid file format. Please upload a JPG, JPEG, or PNG image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size too large. Maximum allowed size is 10MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.post('/auth/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data && res.data.user) {
        updateUser(res.data.user);
      } else if (res.data && res.data.avatar_url) {
        updateUser({ ...user, avatar_url: res.data.avatar_url });
      }

      setSuccessMsg('Profile photo updated successfully!');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to upload photo. Please try again.';
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await api.delete('/auth/avatar');
      if (res.data && res.data.user) {
        updateUser(res.data.user);
      } else {
        updateUser({ ...user, avatar_url: null });
      }
      setSuccessMsg('Profile photo removed. Default avatar icon restored.');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to remove photo.';
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  const currentDisplayAvatar = previewUrl || getAvatarUrl(user.avatar_url);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(145deg, #131b2e 0%, #0d1322 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(139, 92, 246, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa'
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>
                User Profile & Photo
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Manage your account credentials and avatar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Avatar Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            {/* Avatar Frame */}
            <div style={{ position: 'relative', width: '108px', height: '108px' }}>
              <img
                src={currentDisplayAvatar}
                alt={user.full_name}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }}
                style={{
                  width: '108px',
                  height: '108px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #8b5cf6',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.35)',
                  backgroundColor: '#1e293b'
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Choose new photo"
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                  border: '2px solid #0d1322',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                  transition: 'transform 0.2s'
                }}
              >
                <Camera size={16} />
              </button>
            </div>

            {/* Hidden native input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,image/jpeg,image/png,image/jpg"
              style={{ display: 'none' }}
            />

            {/* Quick Upload / Drag Drop Box */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '0.85rem',
                border: '1px dashed rgba(139, 92, 246, 0.4)',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                background: selectedFile ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.01)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#a78bfa' }}>
                <Upload size={16} />
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                  {selectedFile ? selectedFile.name : 'Upload / Change Profile Photo'}
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Supports JPG, JPEG, and PNG (up to 10MB)
              </p>
            </div>

            {/* Remove photo option if custom photo exists */}
            {user.avatar_url && !selectedFile && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.75rem',
                  color: '#f87171',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  background: 'rgba(244, 63, 94, 0.08)'
                }}
              >
                <Trash2 size={13} /> Remove Photo & Use Default Icon
              </button>
            )}

            {/* Action Buttons for Upload */}
            {selectedFile && (
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="spinner" /> Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Save New Photo
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setErrorMsg('');
                  }}
                  disabled={uploading}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Feedback Messages */}
            {errorMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  color: '#f87171',
                  fontSize: '0.78rem',
                  width: '100%'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  color: '#34d399',
                  fontSize: '0.78rem',
                  width: '100%'
                }}
              >
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* User Details Details Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px',
              padding: '0.9rem 1.1rem',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={13} /> Full Name
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>
                {user.full_name}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={13} /> Email Address
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {user.email}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={13} /> Account Role
              </span>
              <span
                className={`badge ${
                  user.role === 'admin'
                    ? 'badge-danger'
                    : user.role === 'faculty'
                    ? 'badge-info'
                    : 'badge-success'
                }`}
                style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
              >
                {user.role}
              </span>
            </div>

            {user.department_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building size={13} /> Department
                </span>
                <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: '600' }}>
                  {user.department_name}
                </span>
              </div>
            )}

            {user.roll_number && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <GraduationCap size={13} /> Student ID
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {user.roll_number}
                </span>
              </div>
            )}

            {user.employee_id && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <GraduationCap size={13} /> Employee ID
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {user.employee_id}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.85rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
