import { useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { handleUploadError, handleValidationError } from "@/lib/error-handler";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { successful: Array<{ uploadURL?: string }> }) => void;
  onFileSelect?: (file: File) => void; // Callback when file is selected
  buttonClassName?: string;
  children: ReactNode;
  skipAclSetting?: boolean; // Skip automatic ACL setting (let parent handle it)
}

/**
 * Simplified file upload component using native HTML file input
 * to avoid Uppy compatibility issues.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  onFileSelect,
  buttonClassName,
  children,
  skipAclSetting = false,
}: ObjectUploaderProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check file size
    if (file.size > maxFileSize) {
      handleValidationError(`File size too large. Maximum should be ${Math.round(maxFileSize / 1024 / 1024)}MB.`);
      return;
    }

    // Call file select callback immediately for preview
    onFileSelect?.(file);
    
    setUploading(true);

    try {
      // Get upload parameters
      const { method, url } = await onGetUploadParameters();
      
      // Upload file directly
      const response = await fetch(url, {
        method,
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Set ACL policy for uploaded media file (unless skipped)
      if (!skipAclSetting) {
        try {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (currentUser.id) {
            await fetch('/api/media/acl', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                mediaURL: url.split('?')[0],
                ownerId: currentUser.id,
              }),
            });
          }
        } catch (error) {
          console.error('Failed to set media ACL:', error);
        }
      }

      // Call completion callback
      onComplete?.({ 
        successful: [{ uploadURL: url.split('?')[0] }] 
      });

    } catch (error) {
      handleUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [maxFileSize, onGetUploadParameters, onComplete]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        data-testid="input-file-upload"
      />
      
      <Button 
        onClick={handleClick} 
        className={buttonClassName}
        disabled={uploading}
        data-testid="button-file-upload"
      >
        {uploading ? t('common.uploading') : children}
      </Button>
    </div>
  );
}