import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import type { DetectionResult } from "../../types";
import { useTranslation } from "react-i18next";

interface PhotoUploadProps {
  onUpload?: (file: File) => Promise<void>;
  onUploadSuccess?: (result: DetectionResult) => void;
  onUploadError?: (error: string) => void;
  onClose?: () => void;
  onCancel?: () => void;
}

export function PhotoUpload({
  onUpload,
  onUploadSuccess,
  onUploadError,
}: PhotoUploadProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        onUploadError?.(t("inventory.photoUpload.errors.invalidFileType"));
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        onUploadError?.(t("inventory.photoUpload.errors.fileTooLarge"));
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onUploadError, t]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      if (onUpload) {
        // Use the onUpload callback if provided
        await onUpload(selectedFile);
      } else {
        // Otherwise use the API directly
        const { apiService } = await import("../../services/api");
        const result = await apiService.uploadInventoryImage(selectedFile);
        onUploadSuccess?.(result);
      }
    } catch (error: any) {
      onUploadError?.(
        error.response?.data?.error || t("inventory.photoUpload.errors.processFailed")
      );
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {!previewUrl ? (
        <div
          className={`border-2 border-dashed rounded-lg p-12 py-16 text-center transition-colors min-h-[300px] flex flex-col items-center justify-center ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-20 w-20 mx-auto mb-6 text-gray-400" />
          <p className="text-xl font-medium mb-3 text-gray-900 dark:text-gray-100">
            {t("inventory.photoUpload.dropTitle")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {t("inventory.photoUpload.dropSubtitle")}
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="lg"
              className="dark:text-white"
            >
              <Upload className="h-5 w-5 mr-2" />
              {t("inventory.photoUpload.chooseFile")}
            </Button>

            {/* Camera input for mobile */}
            <Button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.capture = "environment";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFileSelect(file);
                };
                input.click();
              }}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="h-5 w-5 mr-2" />
              {t("inventory.photoUpload.takePhoto")}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>

          {/* File info */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{selectedFile?.name}</span>
            <span>{(selectedFile!.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={clearSelection}
              variant="outline"
              className="flex-1"
              disabled={isUploading}
            >
              {t("inventory.photoUpload.chooseDifferent")}
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("inventory.photoUpload.analyzing")}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t("inventory.photoUpload.analyze")}
                </>
              )}
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2 text-gray-900 dark:text-gray-100">
              {t("inventory.photoUpload.tips.title")}
            </p>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• {t("inventory.photoUpload.tips.goodLighting")}</li>
              <li>• {t("inventory.photoUpload.tips.clearItems")}</li>
              <li>• {t("inventory.photoUpload.tips.avoidGlare")}</li>
              <li>• {t("inventory.photoUpload.tips.straightPhoto")}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
