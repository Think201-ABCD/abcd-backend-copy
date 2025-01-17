import multer from "multer";

const storage = multer.memoryStorage();

// Upload configuration for the photo. Images have to be less the 1,000,000 bytes in size and should end with .jpg, .jpeg, or .png

export const upload = multer({
    limits: {
        fileSize: 1000000000,
    },

    fileFilter(req: any, file: any, cb: any) {
        // if (!file.originalname.endsWith('.jpg') && !file.originalname.endsWith('.jpeg') && !file.originalname.endsWith('.png')) {
        //     return cb("File must be only .jpeg, .jpg and .png will be accepted with size less than 10 MB", false);
        // }

        cb(null, true);
    },

    storage: storage,
});

export const uploadCSV = multer({
    limits: {
        fileSize: 1000000000,
    },

    fileFilter(_req: any, file: any, cb: any) {
        if (!file.originalname.endsWith(".csv")) {
            return cb("File must be only .csv and will be accepted with size less than 1 MB", false);
        }

        cb(null, true);
    },

    storage: storage,
});

const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, path.join(__dirname, "..", "..", "deploy", "assets"));
        cb(null, `${process.env.APP_ASSET_PATH}`);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

export const diskUpload = multer({
    storage: diskStorage,
    limits: {
        fileSize: 20000000,
    },
});
