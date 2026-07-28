export class Argument {
    name;
    description;
    type;
    required;
    choices;
    constructor(options) {
        this.name = options.name;
        this.description = options.description;
        this.type = options.type;
        this.required = options.required ?? true;
        this.choices = options.choices;
    }
}
