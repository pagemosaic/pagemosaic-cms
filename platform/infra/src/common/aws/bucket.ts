import {Readable} from 'stream';
import {
    S3Client,
    ListObjectsV2Command,
    PutObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    HeadObjectCommand
} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {FileObject, BucketParams} from '../system/Bucket';

const AWS_REGION: string | undefined = process.env.AWS_REGION;

let s3Client: S3Client | undefined = undefined;

export function getS3Client(): S3Client {
    if (!s3Client) {
        s3Client = new S3Client({region: AWS_REGION});
    }
    return s3Client;
}

export async function getFilesInDirectory(
    bucketParams: BucketParams,
    dirName: string
): Promise<Array<FileObject>> {
    const {entryPointDomain, bucketName} = bucketParams;
    const client = getS3Client();
    const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: dirName,
        // The default and maximum number of keys returned is 1000. This limits it to
        // one for demonstration purposes.
        //MaxKeys: 1000,
    });
    let isTruncated: boolean = true;
    const files: Array<FileObject> = [];
    while (isTruncated) {
        const {Contents, IsTruncated, NextContinuationToken} = await client.send(command);
        if (Contents) {
            for (const contentItem of Contents) {
                const {Key, Size, LastModified} = contentItem;
                if (Key) {
                    files.push({
                        id: Key,
                        url: `/${Key}`,
                        defaultUrl: `https://${entryPointDomain}/${Key}`,
                        size: Size,
                        timestamp: LastModified?.getTime()
                    });
                }
            }
        }
        isTruncated = !!IsTruncated;
        command.input.ContinuationToken = NextContinuationToken;
    }
    return files;
}

export async function shouldUpload(bucketName: string, fileKey: string, contentHash: string) {
    try {
        const client = getS3Client();
        const command = new HeadObjectCommand({
            Bucket: bucketName,
            Key: fileKey
        });
        const response = await client.send(command);
        const s3ContentHash = response.Metadata ? response.Metadata['content-hash'] : '';
        return s3ContentHash !== contentHash;
    } catch (error: any) {
        if (error.name === 'NotFound') {
            // The object does not exist, so upload is necessary
            return true;
        }
        // Handle other errors appropriately
        throw error;
    }
}

export async function getUploadUrlForFile(bucketName: string, fileKey: string, contentHash?: string): Promise<string> {
    const client = getS3Client();
    const command = contentHash
        ? new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            Metadata: {
                'content-hash': contentHash
            }
        })
        : new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey
        });

    return getSignedUrl(client, command, {expiresIn: 3600});
}

export async function deleteFiles(bucketName: string, fileNames: Array<string>): Promise<number> {
    const Objects: Array<{ Key: string }> = fileNames.map((fileName: string) => {
        return {Key: fileName}
    });
    const client = getS3Client();
    const command = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
            Objects,
        },
    });
    const {Deleted} = await client.send(command);
    return Deleted ? Deleted.length : 0;
}

export async function getFileContentAsString(bucketName: string, fileKey: string): Promise<string | undefined> {
    const client = getS3Client();
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
    });

    try {
        const {Body} = await client.send(command);
        if (Body && Body instanceof Readable) {
            return streamToString(Body);
        }
    } catch (error) {
        console.error("Error in getFileContentAsString: ", error);
        return undefined;
    }
}

export async function getFileContent(bucketName: string, fileKey: string): Promise<any | undefined> {
    const client = getS3Client();
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
    });
    try {
        const {Body} = await client.send(command);
        return Body;
    } catch (error) {
        console.error("Error in getFileContentAsString: ", error);
        return undefined;
    }
}

function streamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';
        stream.on('data', (chunk) => data += chunk);
        stream.on('end', () => resolve(data));
        stream.on('error', reject);
    });
}

export async function writeFileContentAsString(
    bucketName: string,
    fileKey: string,
    content: string,
    contentType?: string,
    metadata?: Record<string, string>
): Promise<void> {
    const client = getS3Client();
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: content,
        ContentType: contentType,
        Metadata: metadata
    });

    try {
        await client.send(command);
    } catch (error) {
        console.error("Error in writeFileContentAsString: ", error);
        throw error;
    }
}
