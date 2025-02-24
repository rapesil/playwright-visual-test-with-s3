import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

const BUCKET_NAME = "meu-bucket";
const REGION = "us-east-1";
const ACCESS_KEY = "test";
const SECRET_KEY = "test";


const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    },         
    endpoint: "http://localstack2:4566",
    // endpoint: "http://172.20.0.4:4566",
    forcePathStyle: true
});

export async function uploadFileToS3(localFilePath: string, s3Key: string) {
    try {
        const fileStream = fs.createReadStream(localFilePath);

        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileStream,
            ContentType: "image/png",
        };

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        console.log(`🟢 Upload bem-sucedido: ${s3Key}`);
    } catch (error) {
        console.error("❌ Erro ao fazer upload para o S3:", error);
    }
}

export async function downloadFileFromS3(s3Key: string, localPath: string) {

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
    });

    const response = await s3Client.send(command);
    const fileStream = fs.createWriteStream(localPath);
    if (!response.Body) {
        throw new Error(`❌ O corpo da resposta do S3 está vazio para a chave: ${s3Key}`);
    }
    response.Body.pipe(fileStream);

    await new Promise((resolve, reject) => {
        fileStream.on("finish", resolve);
        fileStream.on("error", reject);
    });

    console.log(`🟢 Imagem base baixada: ${localPath}`);

}
