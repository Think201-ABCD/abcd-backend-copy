import Imap from "imap";
import MailParser from "mailparser";
import { TelegramHelper } from "../System/TelegramHelper";



export default class IMAPService {

    imap;

    constructor() {

        this.imap = new Imap({
            user: process.env.GOOGLE_EMAIL,
            password: process.env.GOOGLE_APP_PASSWORD,
            host: process.env.MAIL_SERVER_HOST,
            port: 993,
            tls: true,
            tlsOptions: { servername: 'imap.gmail.com' }
        });
    }

    getImap = function () {
        return this.imap;
    }

    connect = function () {

        return new Promise((resolve, reject) => {
            this.imap.once('error', (err) => {
                reject(err);
            });

            this.imap.once('ready', () => {

                console.log('connection established to Mail Server');

                TelegramHelper.sendToBot("IMAP CONNECTION ESTABLISHED");

                resolve('ready');
            });

            this.imap.connect();
        })
    }


    openBox = function (boxName = 'INBOX', readonly = true) {
        return new Promise((resolve, reject) => {
            this.imap.openBox(boxName, readonly, (err, box) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(box);
            })
        });
    }


    parseMail = function (msg, seqno) {

        return new Promise((resolve, reject) => {

            const email = {
                from_name: null,
                from_address: null,
                subject: null,
                date: null,
                body: null,
                files: [],
                seqno: seqno,
                uid: null,
            };
            const parser = new MailParser.MailParser();

            parser.on('headers', (headers) => {

                email.from_name = headers.get('from').value[0].name;

                email.from_address = headers.get('from').value[0].address.toLowerCase();

                email.subject = headers.get('subject');

                email.date = headers.get('date');

            });

            parser.on('data', (data) => {

                if (data.type === 'attachment') {

                    const buffers = [];

                    data.content.on('data', (buffer) => {

                        buffers.push(buffer);

                    });

                    data.content.on('end', () => {

                        const file = {
                            buffer: Buffer.concat(buffers),
                            mimetype: data.contentType,
                            size: Buffer.byteLength(Buffer.concat(buffers)),
                            originalname: data.filename,
                        };

                        email.files.push(file);

                        data.release();
                    });

                } else if (data.type === 'text') {

                    email.body = data.text;

                }

            });

            parser.on('error', (err) => {

                reject(err);

            });

            parser.on('end', () => {

                resolve(email);

            });

            msg.on('body', function (stream) {

                stream.on('data', function (chunk) {

                    parser.write(chunk);

                });
            });

            msg.once('attributes', function (attrs) {

                email.uid = attrs.uid;

            });

            msg.once('end', () => {

                parser.end();
            });
        });
    }





}