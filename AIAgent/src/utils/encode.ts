import crypto from "crypto";
import yargs from "yargs";
import env from "dotenv";

env.config();
function generatePassword() {
    return {
        key: crypto.randomBytes(32).toString('hex'),
        iv: crypto.randomBytes(16).toString('hex')
    }
}

function encrypt(text: string, key: string, iv: string): string {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt(encryptedText: string, key: string, iv: string): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}  

const args = yargs(process.argv)
            .option("dec", {
                type: "string",
                description: "Path to the character JSON file",
            })
            .option("enc", {
                type: "string",
                description:
                    "Comma separated list of paths to character JSON files",
            })
            .parseSync();

if (args.dec) {
    const password = decrypt(args.dec, process.env.ENCODE_KEY, process.env.ENCODE_IV);
    console.log(password);
}else if (args.enc) {
    const password = encrypt(args.enc, process.env.ENCODE_KEY, process.env.ENCODE_IV);
    console.log(password);
}
export { generatePassword, encrypt, decrypt };