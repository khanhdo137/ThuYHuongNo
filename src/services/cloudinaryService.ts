// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dl6lq6ord';
const CLOUDINARY_UPLOAD_PRESET = 'ThuYHuongNo';

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

export const uploadImageToCloudinary = async (imageUri: string): Promise<string> => {
  try {
    // Tạo FormData
    const formData = new FormData();
    
    // Thêm file ảnh
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg', // hoặc 'image/png' tùy loại ảnh
      name: 'upload.jpg',
    } as any);
    
    // Thêm upload preset
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    // Upload lên Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result: CloudinaryResponse = await response.json();
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Không thể upload ảnh lên Cloudinary');
  }
};

export const uploadVideoToCloudinary = async (videoUri: string): Promise<string> => {
  try {
    console.log('Uploading video to Cloudinary:', videoUri);
    
    // Tạo FormData
    const formData = new FormData();
    
    // Thêm file video
    formData.append('file', {
      uri: videoUri,
      type: 'video/mp4',
      name: 'upload.mp4',
    } as any);
    
    // Thêm upload preset
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('resource_type', 'video');
    
    // Upload lên Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error:', errorText);
      throw new Error('Upload failed');
    }

    const result: CloudinaryResponse = await response.json();
    console.log('Video uploaded successfully:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading video to Cloudinary:', error);
    throw new Error('Không thể upload video lên Cloudinary');
  }
};

// Hàm helper để lấy ảnh từ thư viện hoặc camera
export const pickImage = async (): Promise<string | null> => {
  try {
    const { launchImageLibraryAsync, MediaTypeOptions } = await import('expo-image-picker');
    
    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Tỷ lệ 1:1 cho ảnh vuông
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

// Hàm helper để chụp ảnh từ camera
export const takePhoto = async (): Promise<string | null> => {
  try {
    const { launchCameraAsync, MediaTypeOptions } = await import('expo-image-picker');
    
    const result = await launchCameraAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
};

// Hàm helper để chọn video từ thư viện
export const pickVideo = async (): Promise<string | null> => {
  try {
    const { launchImageLibraryAsync, MediaTypeOptions } = await import('expo-image-picker');
    
    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error picking video:', error);
    return null;
  }
};

// Hàm helper để quay video từ camera
export const recordVideo = async (): Promise<string | null> => {
  try {
    const { launchCameraAsync, MediaTypeOptions } = await import('expo-image-picker');
    
    const result = await launchCameraAsync({
      mediaTypes: MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error recording video:', error);
    return null;
  }
}; 