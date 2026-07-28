export class Event {
    name;
    once;
    constructor(options) {
        this.name = options.name;
        this.once = options?.once ?? false;
    }
}
