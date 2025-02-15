import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
  currentImage?: string;
  accept?: string;
  maxSize?: number; // in bytes
}

export default function ImageUpload({
  onUpload,
  onRemove,
  folder = 'public',
  currentImage,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    try {
      // Validate file
      if (!file) throw new Error('No file provided');

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      }

      setIsUploading(true);

      // Generate unique file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error('Failed to get public URL');

      onUpload(publicUrl);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {currentImage ? (
        <div className="relative">
          <img
            src={currentImage}
            alt="Preview"
            className="w-full h-48 rounded-lg object-cover"
          />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/75 rounded-full transition"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              <span>Upload Image</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
    </div>
  );
}