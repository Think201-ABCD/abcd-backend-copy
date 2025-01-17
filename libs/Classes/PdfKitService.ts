import PDFDocument from "pdfkit";
import axios from "axios";
import markdownToTxt from "markdown-to-txt";

export default class PdfKitService {
    // fonts
    lato_regular = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-Regular.ttf`;
    lato_bold = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-Bold.ttf`;
    lato_semibold = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-Semibold.ttf`;
    lato_italic = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-Italic.ttf`;
    lato_medium = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-Medium.ttf`;
    lato_light = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-Light.ttf`;
    lato_semibold_italic = `${process.env.APP_ASSET_PATH}/fonts/lato/Lato-SemiboldItalic.ttf`;

    // logo
    abcd_logo = `${process.env.APP_PUBLIC_PATH}/logo.jpg`;

    buffers = [];

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
        P_Internal: "Analysis of report through internal guidelines",
        P_External: "Analysis through a macro inclusion lens",
        P_Delta: "Recommendations",
    };

    cleanMarkdownString = (input: string) => {

        // Remove if there is any unquanted "{"
        // Remove if there is any \\n in the string 
        // Remove all the \\ in the string

        let cleaned = input.replace(/\\n/g, '\n');

        cleaned = cleaned.replace(/\\"/g, '"');

        if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
            cleaned = cleaned.slice(1, -1);
        }
        cleaned = cleaned.replace(/"/g, '');

        cleaned = cleaned.replace(/\*\*/g, '');

        cleaned = cleaned.replace(/###/g, ' ');

        cleaned = cleaned.replace(/##/g, ' ');

        cleaned = cleaned.replace(/#/g, ' ');

        return cleaned;
    };

    cleanSummary = (input: string) => {

        // Remove all the unwanted characters from the string
        let cleaned = input.replace("```", "").replace("markdown", "");

        cleaned = cleaned.replace(/##/g, ' ');

        cleaned = cleaned.replace(/#/g, ' ');

        cleaned = cleaned.replace(/\*\*/g, '');

        return cleaned;
    };



    async generateAnalysisPdf(response, orgId) {
        try {
            const doc = new PDFDocument({ size: "A4", autoFirstPage: false });
            doc.on("data", this.buffers.push.bind(this.buffers));

            doc.on("pageAdded", () => {
                doc.image(this.abcd_logo, 72, 27, { height: 17, width: 125 });
            });

            doc.addPage();
            doc.fontSize(14)
                .font(this.lato_bold)
                .text(response?.pdf || response?.text ? `Analysis for "${response?.pdf_name || response?.text}"` : "Analysis Results", { align: "center" });

            doc.moveDown(0.5);
            doc.moveTo(doc.page.margins.left, doc.y)
                .lineTo(doc.page.width - doc.page.margins.right, doc.y)
                .stroke();

            doc.moveDown();

            for (const key of Object.keys(response.generated_analyze_comments)) {
                if (!Object.keys(this.sectionMap).includes(key)) {
                    continue;
                }

                if (key === "P_Custom") {
                    doc.fontSize(12).font(this.lato_bold).text(`Customized Analysis For ${orgId}`);
                } else {
                    doc.fontSize(12).font(this.lato_bold).text(this.sectionMap[key]);
                }

                if (key === "P0") {
                    doc.moveDown();
                    doc.fontSize(11)
                        //
                        .font(this.lato_regular)
                        .moveUp()
                        .text(`${this.cleanSummary(response.generated_analyze_comments[key])}`);
                    doc.moveDown(2);

                    continue;
                }

                response.generated_analyze_comments[key].analyze_comments.forEach((data: any, index) => {
                    doc.moveDown(0.5);

                    // doc.fontSize(11)
                    //     .font(this.lato_regular)
                    //     .text(`${ index + 1}.`);
                    doc.fontSize(11)
                        .font(this.lato_regular)

                        // .moveUp()
                        // .text(`${ data.comment } `, doc.x + doc.widthOfString(`${ index + 1 }.`));
                        .text(`${this.cleanMarkdownString(data.comment)} `);

                    // doc.text("", doc.x - doc.widthOfString(`${ index }.`));
                });

                doc.moveDown(2);
            }

            if (response.generated_analyze_comments?.related_experts?.length) {
                doc.moveDown();
                doc.fontSize(12).font(this.lato_bold).text("Related Experts");
                doc.moveDown(1.5);

                for (const expert of response.generated_analyze_comments.related_experts) {
                    const config: any = {
                        method: "GET",
                        url: expert.photo,
                        responseType: "arraybuffer",
                        responseEncoding: "binary",
                    };
                    const photo = await axios(config);

                    if (115 + doc.y > doc.page.maxY()) {
                        doc.addPage();
                    }
                    const currentY = doc.y;
                    doc.image(photo.data, { height: 115, width: 92 });
                    doc.fontSize(12)
                        .font(this.lato_semibold)
                        .text(expert.name, doc.x + 105, doc.y - 115);
                    doc.fillColor("#0060df").fontSize(11).font(this.lato_italic).text(expert.email).fillColor("black").moveDown(0.5);
                    doc.fontSize(11).font(this.lato_regular).text(expert.short_description).moveDown(0.5);

                    doc.fontSize(11)
                        .font(this.lato_regular)
                        .text(expert.description, doc.x - 105, currentY + 125);
                    doc.moveDown(2.5);
                }
            }

            if (response.generated_analyze_comments?.showcase?.length) {
                doc.fontSize(12).font(this.lato_bold).text("Showcase Data");
                doc.moveDown(0.5);

                let index = 0;

                for (const showcase of response.generated_analyze_comments.showcase) {
                    index += 1;
                    const config: any = {
                        method: "GET",
                        url: showcase.showcase_image,
                        responseType: "arraybuffer",
                        responseEncoding: "binary",
                    };
                    let photo;

                    try {
                        photo = await axios(config);
                        photo.headers?.server === "GSE" ? (photo.data = null) : null;
                    } catch (err) {
                        console.error("Fetch image failed");
                    }

                    doc.fontSize(11).font(this.lato_regular).text(`${index}.`);

                    doc.fontSize(11)
                        .font(this.lato_semibold)
                        .moveUp()
                        .text(showcase.showcase_title, doc.x + doc.widthOfString(`${index}.`));
                    doc.text("", doc.x - doc.widthOfString(`${index}.`));

                    doc.moveDown(0.5);
                    if (115 + doc.y > doc.page.maxY()) {
                        doc.addPage();
                    }

                    photo?.data ? doc.image(photo.data, { height: 115, width: 81 }).moveDown(0.5) : null;
                    doc.fontSize(11).font(this.lato_regular).text(showcase.description);
                    doc.moveDown(0.5);
                    doc.fillColor("#0060df").fontSize(11).font(this.lato_italic).text(showcase.pdf_url, { link: showcase.pdf_url }).fillColor("black");
                    doc.moveDown(2);
                }
            }

            if (response?.conversations?.length) {
                doc.moveDown();
                doc.fontSize(14).font(this.lato_bold).text("CONVERSATIONS", { align: "center" });

                doc.moveDown(0.5);
                doc.moveTo(doc.page.margins.left, doc.y)
                    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
                    .stroke()
                    .moveDown();

                response.conversations.forEach((conversation: any) => {
                    if (conversation.section) {
                        doc.fontSize(11).font(this.lato_semibold_italic).text(`${conversation.role} (${this.sectionMap[conversation.section]}): `);
                        doc.fontSize(11)
                            .font(this.lato_regular)
                            .moveUp()
                            .text(`${conversation.content} `, { indent: doc.widthOfString(`${conversation.role} (${this.sectionMap[conversation.section]}): `) });
                    } else {
                        doc.fontSize(11).font(this.lato_semibold_italic).text(`${conversation.role}: `);
                        doc.fontSize(11)
                            .font(this.lato_regular)
                            .moveUp()
                            .text(`${conversation.content} `, { indent: doc.widthOfString(`${conversation.role}: `) });
                    }
                    doc.moveDown(1.5);
                });
            }

            doc.end();

            return { doc, buffers: this.buffers };
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    generateMailAnalysisPDF = (response) => {
        try {
            const doc = new PDFDocument({ size: "A4", autoFirstPage: false });

            doc.on("data", this.buffers.push.bind(this.buffers));

            doc.on("pageAdded", () => {
                doc.image(this.abcd_logo, 72, 27, { height: 17, width: 125 });
            });

            doc.addPage();

            doc.fontSize(14)
                .font(this.lato_bold)
                .text(response?.pdf_name || response?.text ? `Analysis for "${response?.pdf_name || response?.text}"` : "Analysis Results", { align: "center" });

            doc.moveDown(0.5);

            doc.moveTo(doc.page.margins.left, doc.y)
                .lineTo(doc.page.width - doc.page.margins.right, doc.y)
                .stroke();


            if (response.P0) {
                doc.fontSize(14).font(this.lato_bold).text("Summary", { underline: true });
                doc.moveDown(1);
                doc.fontSize(11).font(this.lato_regular).text(this.cleanSummary(response.P0));
                doc.moveDown(1);
            }

            Object.keys(this.sectionMap).forEach((promptKey) => {
                if (response.hasOwnProperty(promptKey) && promptKey !== "P0" && promptKey !== "P_Custom") {
                    const promptLabel = response[promptKey];

                    doc.fontSize(12).font(this.lato_bold).text(this.sectionMap[promptKey]);
                    // doc.fontSize(14).font("Times-Roman").text(this.sectionMap[promptKey], { underline: true });


                    const comments = promptLabel.analyze_comments;

                    const sources = {};

                    Object.keys(comments).forEach((key) => {

                        doc.moveDown(0.5);

                        const comment: any = comments[key];

                        doc.fontSize(11).font(this.lato_regular).text(`• ${this.cleanMarkdownString(comment.comment)} `);


                        comment.sources.forEach((source) => {
                            sources[source.name] = source.url;
                        });
                    });

                    doc.fontSize(12).font(this.lato_bold).text("Evidence", { underline: true });

                    doc.moveDown(0.7);

                    Object.keys(sources).forEach((source) => {
                        const options: any = {};

                        if (sources[source].length > 0 || sources[source] != "") {
                            options.link = sources[source];
                            options.underline = true;
                        }

                        doc.fontSize(10).font(this.lato_italic).text(source, options);

                        doc.moveDown(0.7);
                    });
                }

                doc.moveDown(1.3);
            });

            doc.end();

            return { doc, buffers: this.buffers };
        } catch (err) {
            console.log(err);
            return null;
        }
    };

    generateEvaluationSessionPdf = (data) => {
        try {
            const doc = new PDFDocument({ size: "A4", autoFirstPage: false });
            doc.on("data", this.buffers.push.bind(this.buffers));

            doc.on("pageAdded", () => {
                doc.image(this.abcd_logo, 72, 27, { height: 17, width: 125 });
            });

            doc.addPage();
            doc.fontSize(14)
                .font(this.lato_bold)
                .text(data?.proposal_pdf_name || data?.proposal_text ? `Evaluation for "${data?.proposal_pdf_name || data?.proposal_text}"` : "Evaluation Results", { align: "center" });
            doc.moveDown(0.5);

            doc.moveTo(doc.page.margins.left, doc.y)
                .lineTo(doc.page.width - doc.page.margins.right, doc.y)
                .stroke();

            doc.moveDown();

            for (const key of Object.keys(this.evaluateSectionMap)) {
                doc.moveDown();
                doc.fontSize(12).font(this.lato_bold).text(this.evaluateSectionMap[key]);
                doc.moveDown(0.5);
                if (key === "P_External") {
                    doc.fontSize(11).font(this.lato_regular).text(`${this.cleanMarkdownString(data.generated_evaluator_comments[key]?.comment)}`);
                } else {
                    doc.fontSize(11).font(this.lato_regular).text(`${this.cleanMarkdownString(data.generated_evaluator_comments[key])} `);
                }
                doc.moveDown();
            }

            if (data?.conversations?.length) {
                doc.moveDown();
                doc.fontSize(14).font(this.lato_bold).text("CONVERSATIONS", { align: "center" });
                doc.moveDown(0.5);

                doc.moveTo(doc.page.margins.left, doc.y)
                    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
                    .stroke()
                    .moveDown();

                data.conversations.forEach((conversation: any) => {
                    if (conversation.section) {
                        doc.fontSize(11).font(this.lato_semibold_italic).text(`${conversation.role} (${this.evaluateSectionMap[conversation.section]}): `);
                        doc.fontSize(11)
                            .font(this.lato_regular)
                            .moveUp()
                            .text(`${conversation.content} `, { indent: doc.widthOfString(`${conversation.role} (${this.evaluateSectionMap[conversation.section]}): `) });
                    } else {
                        doc.fontSize(11).font(this.lato_semibold_italic).text(`${conversation.role}: `);
                        doc.fontSize(11)
                            .font(this.lato_regular)
                            .moveUp()
                            .text(`${conversation.content} `, { indent: doc.widthOfString(`${conversation.role}: `) });
                    }
                    doc.moveDown();
                });
            }

            doc.end();

            return { doc, buffers: this.buffers };
        } catch (error) {
            console.log(error);
            return null;
        }
    };
}
