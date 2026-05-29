// Seus dados do Cloudinary
const CLOUD_NAME = 'drfthd8jr';
const UPLOAD_PRESET = 'kasports_preset';

export const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// Upload de imagem
export async function uploadImage(imageUri: string): Promise<string> {
  const formData = new FormData();
  
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'produto.jpg',
  } as any);
  
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_URL, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  return data.secure_url;
}

// Otimizar imagem para mobile
export function getImageUrl(url: string, width: number = 300): string {
  if (!url) return '';
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
}