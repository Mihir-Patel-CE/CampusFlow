import React, { useState } from 'react';
import { getAvatarUrl, DEFAULT_AVATAR } from '../../services/api';
import { Camera, User } from 'lucide-react';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getRoleGradient = (role) => {
  if (role === 'admin') return 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)';
  if (role === 'faculty') return 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)';
  return 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)';
};

const UserAvatar = ({
  src,
  name = 'User',
  role = 'student',
  size = 38,
  showCamera = false,
  onClick,
  className = '',
  style = {}
}) => {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = getAvatarUrl(src);
  const isDefaultOrEmpty = !src || src === 'default' || avatarUrl === DEFAULT_AVATAR;

  const initials = getInitials(name);
  const gradient = getRoleGradient(role);

  return (
    <div
      onClick={onClick}
      className={`user-avatar-wrapper ${onClick ? 'interactive' : ''} ${className}`}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      title={name}
    >
      {!isDefaultOrEmpty && !imgError ? (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImgError(true)}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(139, 92, 246, 0.4)',
            background: '#1e293b'
          }}
        />
      ) : (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            background: gradient,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: `${Math.max(11, Math.floor(size * 0.38))}px`,
            letterSpacing: '0.02em',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            userSelect: 'none'
          }}
        >
          {initials}
        </div>
      )}

      {showCamera && (
        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: `${Math.max(16, Math.floor(size * 0.34))}px`,
            height: `${Math.max(16, Math.floor(size * 0.34))}px`,
            borderRadius: '50%',
            background: '#8b5cf6',
            border: '2px solid var(--bg-dark, #090d16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
          }}
        >
          <Camera size={Math.max(9, Math.floor(size * 0.18))} />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
