import fs from "node:fs";
import axios from "axios";
import FormData from "form-data";
import dotenv from 'dotenv';
import sharp from 'sharp';
import { Readable } from 'stream';

dotenv.config();

export async function generateImage(prompt: string) {
    const payload = {
        prompt,
        output_format: "png",
        width: 512,
        height: 512,
        nagative_prompt: "low quality, low detail, low resolution, blurry, pixelated, cartoon, sketch, artistic fonts, fantasy-art, digital-art, punk, pixel-art,etc. Less than 300kb"
      };
      try {
        const response = await axios.postForm(
            `https://api.stability.ai/v2beta/stable-image/generate/sd3`,
            axios.toFormData(payload, new FormData()),
            {
            validateStatus: undefined,
            responseType: "arraybuffer",
            headers: { 
                Authorization: `Bearer ${process.env.STABILITY_API_KEY}`, 
                Accept: "image/*" 
            },
            },
        );
        
        if(response.status === 200) {
            // fs.writeFileSync("./lighthouse.png", Buffer.from(response.data));
            const imageBuffer = Buffer.from(response.data);
            // 生成唯一文件名
            const filename = Date.now() + Math.ceil(Math.random() * 1000) + '.png';

            // Compress image before saving
            const compressImage = async (buffer: Buffer): Promise<Buffer> => {
                return sharp(buffer)
                    .resize(512, 512)
                    .png({ quality: 80, compressionLevel: 9 })
                    .toBuffer();
            };

            const compressedImageBuffer = await compressImage(imageBuffer);
            fs.writeFileSync("./logos/" + filename, compressedImageBuffer);

            let param = new FormData();
            console.log('generate image success', filename);
            param.append("file", Readable.from(compressedImageBuffer), filename);
            console.log('file', filename, typeof compressedImageBuffer);
            const config = {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            };
            const res = await axios
              .put('https://upload.wormhole3.io/files/upload?fileName=' + Date.now() + Math.ceil(Math.random() * 1000) + '.' + 'png' + '&path=tiptag&bucket=tiptag', param, config)
            const url = res.data;
            console.log(url);
            return url;
              // .then((res) => {
              //   resolve((res?.data??'').replace('cn-shenzhen', 'accelerate'));
              // })
              // .catch((err) => {
              //   reject(errCode.SERVER_ERROR);
              // });
        } else {
            throw new Error(`${response.status}: ${response.data.toString()}`);
        }
      } catch (error: any) {
        console.log('error:', error);
      }
}

const compressImage = (file: Blob, quality = 0.8, maxWidth = 1024): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        // 计算新的尺寸，保持宽高比
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 转换为JPEG格式并控制质量
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // 如果压缩后的图片比原图还大，则返回原图
              if (blob.size > file.size) {
                resolve(file);
              } else {
                resolve(blob);
              }
            } else {
              resolve(file); // 压缩失败，返回原图
            }
          },
          'image/jpeg',
          quality
        );
      };
    };
  });
};