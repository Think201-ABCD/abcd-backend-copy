import htmlToPdfmake from "html-to-pdfmake";
import { Remarkable } from "remarkable";
import PdfPrinter from "pdfmake";
import jsdom from "jsdom";
import axios from "axios";

// logo
const abcd_logo = `${process.env.APP_PUBLIC_PATH}/logo.jpg`;

// fonts
const lato_regular = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-Regular.ttf`;
const lato_bold = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-Bold.ttf`;
const lato_semibold = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-Semibold.ttf`;
const lato_italic = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-Italic.ttf`;
const lato_medium = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-Medium.ttf`;
const lato_light = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-Light.ttf`;
const lato_semibold_italic = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-SemiboldItalic.ttf`;

export default class PdfMakeService {
    // fonts
    fonts = {
        lato: {
            normal: lato_regular,
            bold: lato_bold,
            italics: lato_italic,
            bolditalics: lato_semibold_italic,
        },
    };

    header = {
        columns: [
            {
                image: abcd_logo,
                width: 135,
                margin: [0, 0, 0, 100],
            },
        ],
        margin: [70, 30, 0, 200],
    };

    content: any = [];
    styles: any = {};
    options = {};

    printer;
    chunks = [];

    sectionMap = {
        P0: "Summary",
        P1: "Behavioural Overview",
        P2: "Behavioural Deep-Dive & Barriers",
        P3: "Cultural & Social Variations",
        P4: "Supply-Side & Chain Factors",
        P5: "Solutions",
        P_Custom: "Custom Section",
    };

    evaluateSectionMap = {
        P_Internal: "Analysis Of Report Through Internal Guidelines",
        P_External: "Behavioural Analysis Through A Macro Lens",
        P_Delta: "Other Ideas & Insights",
    };

    constructor() {
        this.printer = new PdfPrinter(this.fonts);
    }

    cleanMarkdownString = (input: any) => {
        let cleaned = input.replaceAll("```", "").replace("markdown", "");

        if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
            cleaned = cleaned.slice(1, -1);
        }

        return cleaned;
    };

    generateAnalysisPdf = async (response, orgId) => {
        const { JSDOM } = jsdom;
        const { window } = new JSDOM("");
        const md = new Remarkable();

        // get section title
        const getSectionTitle = (promptLabel) => {
            if (promptLabel === "P0") {
                return "Summary";
            }

            const sectionTitle = response.generated_analyze_comments[promptLabel]?.section_title;

            if (sectionTitle === undefined) {
                return promptLabel === "P_Custom" && orgId ? `Customized Analysis For ${orgId}` : this.sectionMap[promptLabel];
            }

            return sectionTitle;
        };

        // Pdf Title
        const title = response?.pdf || response?.text ? `Analysis for "${response?.pdf_name || response?.text}"` : "Analysis Results";
        const titleSection = this._getFormatedTitle(title);
        this.content.push(titleSection);

        // Analyze Comments
        for (const key of Object.keys(this.sectionMap)) {
            if (!Object.keys(response.generated_analyze_comments).includes(key)) {
                continue;
            }

            // const sectionTitle = key === "P_Custom" ? `Customized Analysis For ${orgId}` : this.sectionMap[key];
            const sectionTitle = getSectionTitle(key);

            this.content.push({
                text: sectionTitle,
                fontSize: 14,
                bold: true,
                margin: [0, 20, 0, 10],
            });

            if (key === "P0") {
                const formatedSummary = this.cleanMarkdownString(response.generated_analyze_comments[key]);
                const content = md.render(formatedSummary);
                const html: any = htmlToPdfmake(content, { window: window });

                const formatedObj = html.map((obj: any) => {
                    if (obj.fontSize && obj.fontSize > 12) {
                        obj.fontSize = 12;
                    }
                    return obj;
                });
                this.content.push(formatedObj);
                continue;
            }

            response.generated_analyze_comments[key].analyze_comments.forEach((data: any, index) => {
                const formatedComment = this.cleanMarkdownString(data.comment);
                const content = md.render(formatedComment);
                const html: any = htmlToPdfmake(content, { window: window });
                this.content.push(html);
            });
        }

        // Related Experts
        if (response.generated_analyze_comments?.related_experts?.length) {
            this.content.push({
                text: "Related Experts",
                fontSize: 14,
                bold: true,
                margin: [0, 20, 0, 10],
            });

            for (const expert of response.generated_analyze_comments.related_experts) {
                const config: any = {
                    method: "GET",
                    url: expert.photo,
                    responseType: "arraybuffer",
                    responseEncoding: "binary",
                };
                let photo;

                try {
                    const photoObj = await axios(config);
                    if (photoObj.data) photo = Buffer.from(photoObj.data, "binary").toString("base64");
                } catch (err) {
                    console.error("Fetch experts image failed");
                }

                const expertsData: any = {
                    columns: [
                        {
                            stack: [
                                { text: expert.name, bold: true, fontSize: 12 },
                                { text: expert.email, color: "#0060df", fontSize: 11 },
                                { text: expert.short_description, fontSize: 11, margin: [0, 5, 0, 5] },
                            ],
                            margin: [10, 0, 0, 5],
                        },
                    ],
                    margin: [0, 20, 0, 0],
                };

                if (photo) {
                    expertsData.columns.unshift({
                        image: `data:image/jpeg;base64,${photo}`,
                        width: 92,
                    });
                }

                this.content.push(expertsData);
                this.content.push({ text: expert.description, margin: [0, 5, 0, 15] });
            }
        }

        // Showcase section
        if (response.generated_analyze_comments?.showcase?.length) {
            this.content.push({
                text: "Showcase",
                fontSize: 14,
                bold: true,
                margin: [0, 20, 0, 10],
            });

            let index = 0;

            for (const showcase of response.generated_analyze_comments.showcase) {
                index += 1;
                const config: any = {
                    method: "GET",
                    url: showcase.showcase_image,
                    responseType: "arraybuffer",
                };

                let photo;

                try {
                    const photoObj = await axios(config);
                    photoObj.headers?.server === "GSE" ? (photo.data = null) : null;
                    if (photoObj.data) photo = Buffer.from(photoObj.data, "binary").toString("base64");
                } catch (err) {
                    console.error("Fetch showcase image failed");
                }

                this.content.push({
                    columns: [
                        {
                            text: `${index}. `,
                            width: "auto",
                        },
                        {
                            text: showcase.showcase_title,
                            bold: true,
                            fontSize: 11,
                            width: "*",
                        },
                    ],
                    margin: [0, 0, 0, 10],
                });

                if (photo) {
                    this.content.push({
                        columns: [
                            {
                                image: `data:image/jpeg;base64,${photo}`,
                                width: 81,
                            },
                        ],
                        margin: [0, 0, 0, 10],
                    });
                }

                this.content.push(
                    {
                        text: showcase.description,
                        fontSize: 11,
                    },
                    {
                        text: showcase.pdf_url,
                        link: showcase.pdf_url,
                        italic: true,
                        color: "#0060df",
                        fontSize: 11,
                        margin: [0, 5, 0, 20],
                    }
                );
            }
        }

        // Conversations
        if (response?.conversations?.length) {
            const formatedTitle = this._getFormatedTitle("CONVERSATIONS");
            this.content.push({ text: "", margin: [0, 20, 0, 0] }, formatedTitle, { text: "", margin: [0, 0, 0, 10] });

            response.conversations.forEach((conversation: any) => {
                if (conversation.section) {
                    this.content.push({
                        text: [{ text: `${conversation.role} (${getSectionTitle(conversation.section)}): `, bold: true, italics: true }],
                        fontSize: 11,
                        margin: [0, 5],
                    });
                } else {
                    this.content.push({
                        text: [{ text: `${conversation.role}: `, bold: true, italics: true }],
                        fontSize: 11,
                        margin: [0, 5],
                    });
                }

                const chatContent = md.render(conversation.content);
                const formatedContent: any = htmlToPdfmake(chatContent, { window: window });
                this.content.push(formatedContent);
            });
        }

        // Define document definition
        const docDefinition: any = {
            header: this.header,
            defaultStyle: {
                font: "lato",
                color: "#000000",
            },
            styles: this.styles,
            pageSize: "A4",
            pageMargins: 70,
            content: this.content,
        };

        const pdfDoc = this.printer.createPdfKitDocument(docDefinition, this.options);
        pdfDoc.on("data", this.chunks.push.bind(this.chunks));
        pdfDoc.end();

        return { buffers: this.chunks, doc: pdfDoc };
    };

    private _getFormatedTitle = (title: string) => {
        const pageTitleSection = {
            table: {
                widths: ["*"],
                headerRows: 1,
                body: [
                    [
                        {
                            text: title,
                            alignment: "center",
                            bold: true,
                            fontSize: 14,
                            margin: [0, 0, 0, 5],
                        },
                    ],
                    [
                        {
                            text: "",
                            alignment: "center",
                        },
                    ],
                ],
            },
            layout: "headerLineOnly",
        };

        return pageTitleSection;
    };

    generateEvaluationPdf = (data) => {
        const { JSDOM } = jsdom;
        const { window } = new JSDOM("");
        const md = new Remarkable();

        // get section title
        const getSectionTitle = (promptLabel) => {
            const sectionTitle = data.generated_evaluator_comments[`${promptLabel}_section_title`];

            if (sectionTitle === undefined) {
                return this.evaluateSectionMap[promptLabel];
            }

            return sectionTitle;
        };

        // Pdf Title
        const title = data?.proposal_pdf_name || data?.proposal_text ? `Evaluation for "${data?.proposal_pdf_name || data?.proposal_text}"` : "Evaluation Results";
        const titleSection = this._getFormatedTitle(title);
        this.content.push(titleSection);

        //  Evaluation comments
        for (const key of Object.keys(this.evaluateSectionMap)) {
            if (!Object.keys(data.generated_evaluator_comments).includes(key)) {
                continue;
            }

            this.content.push({
                text: getSectionTitle(key),
                fontSize: 14,
                bold: true,
                margin: [0, 20, 0, 10],
            });

            const sectionContent = key === "P_External" ? data.generated_evaluator_comments[key]?.comment : data.generated_evaluator_comments[key];
            const cleaned = this.cleanMarkdownString(sectionContent);
            const content = md.render(cleaned);
            const html: any = htmlToPdfmake(content, { window: window });

            const formatedObj = html.map((obj: any) => {
                if (obj.fontSize && obj.fontSize > 12) {
                    obj.fontSize = 12;
                }
                return obj;
            });

            this.content.push(formatedObj);
        }

        // Converstaions
        if (data?.conversations?.length) {
            const formatedTitle = this._getFormatedTitle("CONVERSATIONS");
            this.content.push({ text: "", margin: [0, 20, 0, 0] }, formatedTitle, { text: "", margin: [0, 0, 0, 10] });

            data.conversations.forEach((conversation: any) => {
                if (conversation.section) {
                    this.content.push({
                        text: [{ text: `${conversation.role} (${getSectionTitle(conversation.section)}): `, bold: true, italics: true }],
                        fontSize: 11,
                        margin: [0, 5],
                    });
                } else {
                    this.content.push({
                        text: [{ text: `${conversation.role}: `, bold: true, italics: true }],
                        fontSize: 11,
                        margin: [0, 5],
                    });
                }

                const chatContent = md.render(conversation.content);
                const formatedContent: any = htmlToPdfmake(chatContent, { window: window });
                this.content.push(formatedContent);
            });
        }

        // Define document definition
        const docDefinition: any = {
            header: this.header,
            defaultStyle: {
                font: "lato",
                color: "#000000",
            },
            styles: this.styles,
            pageSize: "A4",
            pageMargins: 70,
            content: this.content,
        };

        const pdfDoc = this.printer.createPdfKitDocument(docDefinition, this.options);
        pdfDoc.on("data", this.chunks.push.bind(this.chunks));
        pdfDoc.end();

        return { buffers: this.chunks, doc: pdfDoc };
    };
}
