
export class Clock {
    constructor() {
        this.init = performance.now();
        this.history = [0.00];
    }

    record() {
        const relative = performance.now() - this.init;
        this.history.push(relative);

        return relative;
    }

    interval() {
        const length = this.history.length;
        const interval = performance.now() - this.init - this.history[length - 1];;

        return interval;
    }

    delete() {
        return this.history.pop();
    }

    lap() {
        const length = this.history.length;

        return this.history[length - 1] - this.history[length - 2];
    }

    last() {
        const length = this.history.length;

        return this.history[length - 1];
    }
}
