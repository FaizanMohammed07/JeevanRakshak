import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const generateFileName = (patientName, doctorName) => {
  const sanitizedPatientName = patientName
    ? String(patientName).toLowerCase().replace(/\s+/g, "-")
    : "unknown-patient-name";
  const sanitizedDoctorName = doctorName
    ? String(doctorName).toLowerCase().replace(/\s+/g, "-")
    : "unknown-doctor-name";

  const uniqueId = crypto.randomBytes(16).toString("hex");
  return `${sanitizedPatientName}-${sanitizedDoctorName}-${uniqueId}`;
};

// export const uploadToS3 = async (file) => {
//   try {
//     const uniqueId = crypto.randomBytes(16).toString("hex");
//     const upload = new Upload({
//       client: s3,
//       params: {
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: `${uniqueId}-${file.originalname}`,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//       },
//     });

//     const result = await upload.done();

//     // ✅ AWS SDK v3 returns the uploaded object's info in result.Key
//     const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${result.Key}`;

//     return imageUrl;
//   } catch (error) {
//     console.error("Error uploading to S3:", error);
//     throw error;
//   }
// };

export const uploadCompressedImages = async (
  files,
  patientName,
  doctorName
) => {
  const imageUrls = [];

  //   console.log("AWS CONFIG CHECK:", {
  //     bucketName: process.env.AWS_BUCKET_NAME,
  //     region: process.env.AWS_BUCKET_REGION,
  //     accessKeyId: process.env.AWS_ACCESS_KEY,
  //     secretAccessKeyIsMissing: process.env.AWS_SECRET_ACCESS_KEY,
  //   });

  //   console.log(files);

  for (const file of files) {
    try {
      const fileName = generateFileName(patientName, doctorName);

      // 🔥 sharp transforms buffer → stream (no disk)
      const transformer = sharp(file.buffer)
        .rotate()
        .resize({ width: 1200 })
        .jpeg({ quality: 80 })
        .toFormat("jpeg");

      // 🔥 stream transformer directly into S3
      const upload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileName,
          Body: transformer, // stream
          ContentType: "image/jpeg",
        },
      });

      await upload.done();

      const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${fileName}`;
      imageUrls.push(imageUrl);
    } catch (err) {
      console.error(
        `Error processing or uploading file ${file.originalname}:`,
        err
      );
    }
  }

  return imageUrls;
};
