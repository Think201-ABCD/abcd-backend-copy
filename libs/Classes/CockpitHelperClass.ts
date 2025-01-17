export class CockpitHelperClass {
    static docTypes = [
        "Policy Document",
        "Program design Document",
        "Investment or grant proposal",
        "Strategy recommendations",
        "Research draft or proposal",
        "Media article or draft",
        "School or college course outline",
        "MEL approach",
        "Product or service design",
    ];

    static getPromptsHeaders = () => {
        const columns = [
            { header: "Prompt Type", key: "prompt_type" },

            ...this.docTypes.map((docType: string) => {
                return { header: docType, key: docType };
            }),
        ];

        return columns;
    };

    static getSummaryPromptsHeaders = () => {
        const columns = [
            ...this.docTypes.map((docType: string) => {
                return { header: docType, key: docType };
            }),
        ];

        return columns;
    };
}
