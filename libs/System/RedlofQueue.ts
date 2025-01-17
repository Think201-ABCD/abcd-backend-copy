import Queue from "bull";

export class RedlofQueue {
    // Queue Map
    static queueMap = new Map();

    //
    static createQueue(name: string) {
        //
        if (RedlofQueue.queueMap.has(name)) {
            // return if it exists
            return RedlofQueue.queueMap.get(name);
        }

        // Create the queue
        const queueObj: any = new Queue(name, {
            redis: {},
            limiter: {
                max: 1,
                duration: 600,
            },
        });

        RedlofQueue.queueMap.set(name, queueObj);

        return queueObj;
    }

    static addToQueue(name: string, data: any) {
        const queueObj = RedlofQueue.createQueue(name);

        // options
        const options = {
            removeOnComplete: true,
        };

        queueObj.add(data, options);
    }

    static removeAll(name: string) {
        const queueObj = RedlofQueue.createQueue(name);

        //queueObj.drain(true)
        queueObj.clean(0);
    }
}
